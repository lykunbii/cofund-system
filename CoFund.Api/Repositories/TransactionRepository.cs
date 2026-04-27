using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Models;

namespace CoFund.Api.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly ApplicationDbContext _context;

    // Tiêm (Inject) DbContext vào đây
    public TransactionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<object>> GetAllTransactionsAsync()
    {
        return await _context.Transactions
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new {
                t.Id,
                t.Amount,
                t.Note,
                t.TransactionDate,
                t.TransactionType,
                UserName = "Nguyễn Thị Lý" 
            })
            .ToListAsync();
    }

    public async Task<Transaction> AddTransactionAsync(Transaction transaction)
    {
        var group = await _context.Groups.FindAsync(transaction.GroupId);
        if (group == null) throw new Exception("Không tìm thấy thông tin quỹ!");

        // Logic Thu/Chi
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
        await _context.SaveChangesAsync();

        return transaction;
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

    public async Task<IEnumerable<Transaction>> GetTransactionsByGroupAsync(int groupId)
    {
        return await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();
    }

    // --- ĐÂY CHÍNH LÀ HÀM BỊ THIẾU ĐƯỢC THÊM VÀO ---
    public string GeneratePaymentQrUrl(decimal amount, string note)
    {
        // 1. Thông tin tài khoản nhận tiền
        string bankId = "MB"; // Thay bằng mã ngân hàng của bạn (VD: MB, VCB, TCB)
        string accountNo = "0123456789"; // Thay bằng Số tài khoản thật của bạn
        string accountName = "NGUYEN THI LY"; // Thay bằng Tên chủ tài khoản (Viết hoa không dấu)
        
        // 2. Mã hóa nội dung ghi chú để URL không bị lỗi font
        string encodedNote = Uri.EscapeDataString(note);
        
        // 3. Lắp ráp thành đường link API của VietQR
        string qrUrl = $"https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount={amount}&addInfo={encodedNote}&accountName={accountName}";
        
        return qrUrl;
    }
    public async Task<GroupMember> JoinGroupAsync(int userId, string joinCode)
    {
        // 1. Tìm quỹ khớp với mã mời
        var group = await _context.Groups.FirstOrDefaultAsync(g => g.JoinCode == joinCode);
        if (group == null) 
            throw new Exception("Mã tham gia không hợp lệ hoặc quỹ không tồn tại!");

        // 2. Kiểm tra xem người này đã ở trong quỹ từ trước chưa
        var isExist = await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == group.Id && gm.UserId == userId);
            
        if (isExist) 
            throw new Exception("Bạn đã là thành viên của quỹ này rồi, không cần tham gia lại!");

        // 3. Tạo tư cách thành viên mới
        var newMember = new GroupMember
        {
            UserId = userId,
            GroupId = group.Id,
            Role = "Member",     // Mặc định người tham gia qua mã chỉ là Member
            IsPaid = false,      // Mới vào thì chưa đóng tiền
            JoinedAt = DateTime.Now
        };

        _context.GroupMembers.Add(newMember);
        await _context.SaveChangesAsync();

        return newMember;
    }
}