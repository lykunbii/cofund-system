using CoFund.Api.Models;

namespace CoFund.Api.Repositories;

public interface ITransactionRepository
{
    // Lấy danh sách giao dịch
    Task<IEnumerable<object>> GetAllTransactionsAsync();
    
    // Thêm giao dịch mới (Thu/Chi)
    Task<Transaction> AddTransactionAsync(Transaction transaction);
    Task<Group?> GetGroupByIdAsync(int groupId);
    Task<decimal> GetGroupTotalAsync(int groupId);
    Task<IEnumerable<Transaction>> GetTransactionsByGroupAsync(int groupId);
    // Hàm tạo link ảnh QR Code
    string GeneratePaymentQrUrl(decimal amount, string note);
    // Hàm tham gia quỹ bằng mã
    Task<GroupMember> JoinGroupAsync(int userId, string joinCode);
}