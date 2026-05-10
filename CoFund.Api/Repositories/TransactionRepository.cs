using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using CoFund.Api.Data;
using CoFund.Api.Models;
using CoFund.Api.Hubs;

namespace CoFund.Api.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly ApplicationDbContext _context;
    // 1. KHAI BÁO BIẾN ĐỂ GỌI SIGNALR
    private readonly IHubContext<NotificationHub> _hubContext; 

    // 2. TIÊM SIGNALR VÀO CONSTRUCTOR
    public TransactionRepository(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

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
                      t.Status, // MỚI THÊM: Để xuất hiện trạng thái duyệt
                      UserName = u.FullName 
                  })
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();
    }

    public async Task<Transaction> AddTransactionAsync(Transaction transaction)
    {
        // BẮT ĐẦU GIAO DỊCH (TRANSACTION)
        // Mở một "hộp an toàn", mọi thay đổi từ giờ trở đi chỉ mang tính tạm thời
        await using var dbTransaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var group = await _context.Groups.FindAsync(transaction.GroupId);
            if (group == null) throw new Exception("Không tìm thấy thông tin quỹ!");

            // [ĐÃ SỬA] Tước quyền cộng/trừ tiền trực tiếp ở đây để áp dụng Luồng Phê Duyệt
            if (transaction.TransactionType != 1 && transaction.TransactionType != 2)
            {
                throw new Exception("Loại giao dịch không hợp lệ!");
            }

            transaction.TransactionDate = DateTime.Now;
            transaction.Status = 0; // Đưa vào trạng thái Chờ duyệt
            _context.Transactions.Add(transaction);
            
            // Cố tình GỌI LƯU TẠM THỜI để lấy ID của transaction (nếu cần)
            await _context.SaveChangesAsync(); 

            // 2. Xử lý logic tạo thông báo
            var user = await _context.Users.FindAsync(transaction.UserId);
            string actionText = transaction.TransactionType == 1 ? "nộp vào" : "rút ra";
            string amountText = transaction.Amount.ToString("#,##0"); 

            var otherMembers = await _context.GroupMembers
                .Where(gm => gm.GroupId == transaction.GroupId && gm.UserId != transaction.UserId)
                .ToListAsync();

            if (otherMembers.Any())
            {
                var notifications = otherMembers.Select(m => new Notification
                {
                    UserId = m.UserId,
                    Title = $"Biến động số dư: {group.Name}",
                    // Cập nhật câu chữ một chút cho hợp lý với việc "Gửi yêu cầu"
                    Message = $"{user?.FullName ?? "Một thành viên"} vừa gửi yêu cầu {actionText} {amountText}đ. Lý do: {transaction.Note}",
                    CreatedAt = DateTime.Now,
                    IsRead = false
                });

                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync(); 
            }

            // 3. CHỐT GIAO DỊCH (COMMIT)
            // Nếu code chạy mượt mà đến đây không có lỗi, ta mới chính thức ghi toàn bộ xuống Database vật lý
            await dbTransaction.CommitAsync();

            // 4. Báo hiệu Real-time cho Frontend (Chỉ phát thông báo khi DB đã ghi thành công)
            if (otherMembers.Any())
            {
                await _hubContext.Clients.All.SendAsync("ReceiveNotification");
            }

            return transaction;
        }
        catch (Exception ex)
        {
            // QUAY XE (ROLLBACK)
            // Nếu có BẤT KỲ lỗi gì xảy ra (ví dụ: mất kết nối DB ở bước 2), 
            // nó sẽ nhảy vào đây và HỦY BỎ toàn bộ các lệnh _context.SaveChangesAsync() trước đó.
            // Tiền trong quỹ sẽ tự động trả về như cũ.
            await dbTransaction.RollbackAsync();
            
            // Báo lỗi ra ngoài
            throw new Exception($"Giao dịch thất bại, hệ thống đã hoàn tác: {ex.Message}");
        }
    }
    
    public async Task<IEnumerable<object>> GetTransactionsByGroupAsync(int groupId)
    {
        return await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .Join(_context.Users, t => t.UserId, u => u.Id, (t, u) => new { t, u })
            // [ĐÃ FIX LỖI ĐỎ] Ép kiểu (int?) cho c.Id để Entity Framework không cãi nhau về kiểu dữ liệu
            .GroupJoin(_context.Categories, x => x.t.CategoryId, c => (int?)c.Id, (x, c) => new { x.t, x.u, c })
            .SelectMany(x => x.c.DefaultIfEmpty(), (x, c) => new {
                x.t.Id,
                x.t.UserId,
                UserName = x.u.FullName, 
                CategoryName = c != null ? c.Name : "Chưa phân loại", 
                x.t.GroupId,
                x.t.Amount,
                x.t.TransactionType,
                x.t.TransactionDate,
                x.t.Note,
                x.t.Status // [MỚI THÊM] Để React đọc được trạng thái Vàng/Xanh/Đỏ
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

    public string GeneratePaymentQrUrl(decimal amount, string note)
    {
        string bankId = "MB"; 
        string accountNo = "0123456789"; 
        string accountName = "NGUYEN THI LY"; 
        
        string encodedNote = Uri.EscapeDataString(note);
        return $"https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount={amount}&addInfo={encodedNote}&accountName={accountName}";
    }

    public async Task<GroupMember> JoinGroupAsync(int userId, string joinCode)
    {
        var group = await _context.Groups.FirstOrDefaultAsync(g => g.JoinCode == joinCode);
        if (group == null) 
            throw new Exception("Mã tham gia không hợp lệ hoặc quỹ không tồn tại!");

        var isExist = await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == group.Id && gm.UserId == userId);
            
        if (isExist) 
            throw new Exception("Bạn đã là thành viên của quỹ này rồi!");

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

    public async Task SendInAppReminderAsync(int adminUserId, int targetUserId, int groupId)
    {
        var adminCheck = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == adminUserId);
            
        if (adminCheck == null || !adminCheck.Role.Contains("Admin"))
            throw new UnauthorizedAccessException("Bảo mật: Chỉ Quản trị viên của quỹ mới được phép gửi nhắc nhở!");

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
        
        // 4. PHÁT SÓNG SIGNALR ĐẾN TOÀN BỘ CLIENT ĐANG ONLINE
        await _hubContext.Clients.All.SendAsync("ReceiveNotification");
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