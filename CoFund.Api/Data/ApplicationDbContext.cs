using Microsoft.EntityFrameworkCore;
using CoFund.Api.Models;

namespace CoFund.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
        : base(options) { }

    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Group> Groups { get; set; }
    // Thêm các DbSet cho User, Group sau này...
    // --- 2 DÒNG MỚI THÊM VÀO ---
    public DbSet<User> Users { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
}