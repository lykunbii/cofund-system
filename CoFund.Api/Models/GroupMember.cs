namespace CoFund.Api.Models;

public class GroupMember
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int GroupId { get; set; }
    
    // Vai trò trong nhóm: "Admin" (Người tạo quỹ/Thủ quỹ) hoặc "Member" (Thành viên đóng quỹ)
    public string Role { get; set; } = "Member"; 
    
    // Đánh dấu xem thành viên này đã đóng đủ tiền mục tiêu chưa
    public bool IsPaid { get; set; } = false; 
    
    public DateTime JoinedAt { get; set; } = DateTime.Now;
}