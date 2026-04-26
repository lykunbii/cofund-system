namespace CoFund.Api.Models;

public class Group
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; } // Mô tả mục đích quỹ
    public decimal TargetAmount { get; set; }
    public decimal CurrentBalance { get; set; } = 0; // Lưu số dư hiện tại để load cho nhanh
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}