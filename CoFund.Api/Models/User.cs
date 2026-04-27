namespace CoFund.Api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    // Tạm thời chúng ta để mật khẩu dạng chuỗi thường cho dễ test. 
    // Sau này làm tính năng Đăng nhập sẽ nâng cấp lên mã hóa băm (Hash) sau nhé!
    public string Password { get; set; } = string.Empty; 
    
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}