using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Models;

namespace CoFund.Api.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly ApplicationDbContext _context;

    public TransactionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // 1. Lấy tất cả giao dịch (Đã fix lỗi hardcode tên)
    public async Task<IEnumerable<object>> GetAllTransactionsAsync()
    {
        return await _context.Transactions
            .Join(_context.Users,
                  t => t.UserId,
                  u => u.Id,
                  (t, u) => new {
                      t.Id,
                      t.Amount,
                      t.Note,
                      t.TransactionDate,
                      t.TransactionType,
                      UserName = u.FullName 
                  })
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();
    }

    // 2. Thêm giao dịch & TỰ ĐỘNG THÔNG BÁO
    public async Task<Transaction> AddTransactionAsync(Transaction transaction)
    {
        var group = await _context.Groups.FindAsync(transaction.GroupId);
        if (group == null) throw new Exception("Không tìm thấy thông tin quỹ!");

        // Xử lý cộng/trừ tiền quỹ
        if (transaction.TransactionType == 1) 
        {
            group.CurrentBalance += transaction.Amount;
        }
        else if (transaction.TransactionType == 2)
        {
            if (group.CurrentBalance < transaction.Amount)
                throw new Exception("Số dư quỹ không đủ để thực hiện khoản chi này!");
            
            group.CurrentBalance -= transaction.Amount;
        }
        else
        {
            throw new Exception("Loại giao dịch không hợp lệ!");
        }

        transaction.TransactionDate = DateTime.Now;
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync(); // Lưu giao dịch trước để lấy ID (nếu cần)

        // --- LOGIC TỰ ĐỘNG THÔNG BÁO ---
        var user = await _context.Users.FindAsync(transaction.UserId);
        string actionText = transaction.TransactionType == 1 ? "nộp vào" : "rút ra";
        string amountText = transaction.Amount.ToString("#,##0"); 

        // Tìm các thành viên khác trong quỹ (trừ người thực hiện giao dịch)
        var otherMembers = await _context.GroupMembers
            .Where(gm => gm.GroupId == transaction.GroupId && gm.UserId != transaction.UserId)
            .ToListAsync();

        if (otherMembers.Any())
        {
            var notifications = otherMembers.Select(m => new Notification
            {
                UserId = m.UserId,
                Title = $"Biến động số dư: {group.Name}",
                Message = $"{user?.FullName ?? "Một thành viên"} vừa {actionText} {amountText}đ. Lý do: {transaction.Note}",
                CreatedAt = DateTime.Now,
                IsRead = false
            });

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync(); // Lưu danh sách thông báo
        }

        return transaction;
    }
    
    // 3. Lấy giao dịch theo quỹ (Đã dùng GroupJoin để Left Join Category)
    public async Task<IEnumerable<object>> GetTransactionsByGroupAsync(int groupId)
    {
        return await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .Join(_context.Users, t => t.UserId, u => u.Id, (t, u) => new { t, u })
            // Sử dụng GroupJoin và SelectMany để thực hiện LEFT JOIN với Category
            .GroupJoin(_context.Categories, x => x.t.CategoryId, c => c.Id, (x, c) => new { x.t, x.u, c })
            .SelectMany(x => x.c.DefaultIfEmpty(), (x, c) => new {
                x.t.Id,
                x.t.UserId,
                UserName = x.u.FullName, 
                CategoryName = c != null ? c.Name : "Chưa phân loại", 
                x.t.GroupId,
                x.t.Amount,
                x.t.TransactionType,
                x.t.TransactionDate,
                x.t.Note
            })
            .OrderByDescending(t => t.TransactionDate) 
            .ToListAsync();
    }

    public async Task<Group?> GetGroupByIdAsync(int groupId)
    {
        return await _context.Groups.FindAsync(groupId);
    }

    public async Task<decimal> GetGroupTotalAsync(int groupId)
    {
        return await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .SumAsync(t => t.Amount);
    }

    // 4. Tạo QR Code VietQR
    public string GeneratePaymentQrUrl(decimal amount, string note)
    {
        string bankId = "MB"; // Mã ngân hàng
        string accountNo = "0123456789"; // STK
        string accountName = "NGUYEN THI LY"; // Tên chủ thẻ không dấu
        
        string encodedNote = Uri.EscapeDataString(note);
        return $"https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount={amount}&addInfo={encodedNote}&accountName={accountName}";
    }

    // 5. Tham gia quỹ
    public async Task<GroupMember> JoinGroupAsync(int userId, string joinCode)
    {
        var group = await _context.Groups.FirstOrDefaultAsync(g => g.JoinCode == joinCode);
        if (group == null) 
            throw new Exception("Mã tham gia không hợp lệ hoặc quỹ không tồn tại!");

        var isExist = await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == group.Id && gm.UserId == userId);
            
        if (isExist) 
            throw new Exception("Bạn đã là thành viên của quỹ này rồi, không cần tham gia lại!");

        var newMember = new GroupMember
        {
            UserId = userId,
            GroupId = group.Id,
            Role = "Member",    
            IsPaid = false,     
            JoinedAt = DateTime.Now
        };

        _context.GroupMembers.Add(newMember);
        await _context.SaveChangesAsync();
        return newMember;
    }

    // 6. Tạo quỹ mới
    public async Task<Group> CreateGroupAsync(CreateGroupRequest request)
    {
        var newGroup = new Group
        {
            Name = request.Name,
            TargetAmount = request.TargetAmount,
            CurrentBalance = 0,
            EndDate = request.EndDate
        };
        
        _context.Groups.Add(newGroup);
        await _context.SaveChangesAsync(); 

        var newAdmin = new GroupMember
        {
            UserId = request.UserId,
            GroupId = newGroup.Id,
            Role = "Admin (Thủ quỹ)", 
            IsPaid = true, 
            JoinedAt = DateTime.Now
        };
        
        _context.GroupMembers.Add(newAdmin);
        await _context.SaveChangesAsync();

        return newGroup;
    }

    public async Task<IEnumerable<Group>> GetUserGroupsAsync(int userId)
    {
        return await _context.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Join(_context.Groups, gm => gm.GroupId, g => g.Id, (gm, g) => g)
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetGroupMembersAsync(int groupId)
    {
        return await _context.GroupMembers
            .Where(gm => gm.GroupId == groupId)
            .Join(_context.Users,
                  gm => gm.UserId,
                  u => u.Id,
                  (gm, u) => new {
                      gm.Id,
                      UserId = u.Id,
                      Name = u.FullName,
                      gm.Role,
                      gm.IsPaid,
                      gm.JoinedAt
                  })
            .ToListAsync();
    }

    // ==========================================
    // NHÓM TÍNH NĂNG THÔNG BÁO (NOTIFICATIONS)
    // ==========================================

    public async Task SendInAppReminderAsync(int adminUserId, int targetUserId, int groupId)
    {
        // Kiểm tra quyền Admin
        var adminCheck = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == adminUserId);
            
        if (adminCheck == null || !adminCheck.Role.Contains("Admin"))
            throw new UnauthorizedAccessException("Bảo mật: Chỉ Quản trị viên của quỹ mới được phép gửi nhắc nhở!");

        // Kiểm tra target có tồn tại trong quỹ không
        var targetCheck = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == targetUserId);
            
        if (targetCheck == null)
            throw new Exception("Lỗi: Người nhận không phải là thành viên của quỹ này!");

        var group = await _context.Groups.FindAsync(groupId);

        var notification = new Notification
        {
            UserId = targetUserId,
            Title = $"🔔 Nhắc nhở từ quỹ: {group?.Name}",
            Message = $"Thủ quỹ vừa gửi lời nhắc: Bạn có khoản quỹ định kỳ đang chờ hoàn thành. Vui lòng kiểm tra và đóng quỹ nhé!",
            CreatedAt = DateTime.Now,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(int userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20) 
            .ToListAsync();
    }

    public async Task MarkNotificationAsReadAsync(int notificationId)
    {
        var noti = await _context.Notifications.FindAsync(notificationId);
        if (noti != null)
        {
            noti.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }
}