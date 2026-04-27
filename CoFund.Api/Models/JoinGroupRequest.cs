namespace CoFund.Api.Models;

public class JoinGroupRequest
{
    // Tạm thời truyền UserId từ React lên (sau này làm tính năng Đăng nhập xong, ta sẽ lấy tự động từ Token bảo mật)
    public int UserId { get; set; } 
    public string JoinCode { get; set; } = string.Empty;
}