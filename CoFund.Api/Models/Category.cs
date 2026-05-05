namespace CoFund.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Type { get; set; } // 1: Thu, 2: Chi
}