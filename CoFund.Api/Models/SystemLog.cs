using System.ComponentModel.DataAnnotations;

namespace CoFund.Api.Models;

public class SystemLog
{
    [Key]
    public int Id { get; set; }
    public required string TableName { get; set; } // Tên bảng bị tác động (Groups, Transactions...)
    public required string Action { get; set; }    // Loại thao tác (INSERT, UPDATE, DELETE)
    public string? KeyValues { get; set; }         // ID của dòng bị sửa
    public string? OldValues { get; set; }         // Dữ liệu CŨ trước khi sửa (Lưu dạng JSON)
    public string? NewValues { get; set; }         // Dữ liệu MỚI sau khi sửa (Lưu dạng JSON)
    public string? UserId { get; set; }            // Kẻ nào đã làm việc này? (Lấy từ Token)
    public DateTime Timestamp { get; set; } = DateTime.Now;
}