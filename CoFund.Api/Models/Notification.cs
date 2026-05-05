namespace CoFund.Api.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; } // ID của người nhận thông báo
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false; // Trạng thái đã đọc/chưa đọc
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}