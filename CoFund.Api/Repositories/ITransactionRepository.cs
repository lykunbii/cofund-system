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
    Task<IEnumerable<object>> GetTransactionsByGroupAsync(int groupId);
    // Hàm tạo link ảnh QR Code
    string GeneratePaymentQrUrl(decimal amount, string note);
    // Hàm tham gia quỹ bằng mã
    Task<GroupMember> JoinGroupAsync(int userId, string joinCode);
    // Hàm tạo quỹ mới
    Task<Group> CreateGroupAsync(CreateGroupRequest request);
    // Lấy danh sách quỹ mà một User đang tham gia
    Task<IEnumerable<Group>> GetUserGroupsAsync(int userId);
    // Lấy danh sách thành viên thật của một quỹ
    Task<IEnumerable<object>> GetGroupMembersAsync(int groupId);
    // Gửi thông báo có kiểm tra quyền Admin
    Task SendInAppReminderAsync(int adminUserId, int targetUserId, int groupId);
    // Lấy danh sách thông báo của 1 user
    Task<IEnumerable<Notification>> GetUserNotificationsAsync(int userId);
    // Đánh dấu đã đọc
    Task MarkNotificationAsReadAsync(int notificationId);
}