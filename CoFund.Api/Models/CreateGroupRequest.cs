namespace CoFund.Api.Models;

public class CreateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public DateTime? EndDate { get; set; }
    public int UserId { get; set; } 
}