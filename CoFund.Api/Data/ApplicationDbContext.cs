using Microsoft.EntityFrameworkCore;
using CoFund.Api.Models;

namespace CoFund.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Các bảng đã có từ trước
    public DbSet<User> Users { get; set; }
    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    
    // 1. THÊM BẢNG CATEGORY VÀO ĐÂY
    public DbSet<Category> Categories { get; set; }

    // 2. HÀM ONMODELCREATING ĐỂ CHÈN DỮ LIỆU MẪU (SEED DATA)
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Chèn sẵn 5 danh mục mặc định vào database khi khởi tạo
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Đóng quỹ định kỳ", Type = 1 }, // Thu
            new Category { Id = 2, Name = "Tiền lãi/Tài trợ", Type = 1 }, // Thu
            new Category { Id = 3, Name = "Mua sắm thiết bị", Type = 2 }, // Chi
            new Category { Id = 4, Name = "Liên hoan/Sự kiện", Type = 2 },// Chi
            new Category { Id = 5, Name = "Chi phí khác", Type = 2 }      // Chi
        );
    }
    public DbSet<Notification> Notifications { get; set; }
}