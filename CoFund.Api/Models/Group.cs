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
    public string JoinCode { get; set; } = Guid.NewGuid().ToString().Substring(0, 6).ToUpper();
    public DateTime? EndDate { get; set; }
    public string? BankBin { get; set; }           // Mã ngân hàng (VD: VCB, MB, ICB)
    public string? BankAccountNumber { get; set; } // Số tài khoản
    public string? BankAccountName { get; set; }   // Tên chủ tài khoản
}