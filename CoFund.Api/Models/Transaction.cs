using System.ComponentModel.DataAnnotations;
namespace CoFund.Api.Models;
public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int GroupId { get; set; }
    public decimal Amount { get; set; }
    public int TransactionType { get; set; } = 1; 
    public string? Note { get; set; }
    
    // Đảm bảo tên là TransactionDate
    public DateTime TransactionDate { get; set; } = DateTime.Now; 
    public int? CategoryId { get; set; } // Cho phép null để không lỗi dữ liệu cũ
}