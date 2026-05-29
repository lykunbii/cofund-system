using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using CoFund.Api.Models;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace CoFund.Api.Data;

public class ApplicationDbContext : DbContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // TIÊM HttpContext ĐỂ LẤY ID NGƯỜI DÙNG TỪ TOKEN JWT
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IHttpContextAccessor httpContextAccessor) : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    // Các bảng dữ liệu của bạn
    public DbSet<User> Users { get; set; }
    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    // Nếu bạn có bảng Categories, Notifications thì bỏ comment:
    // public DbSet<Category> Categories { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    
    // BẢNG MỚI: BẢNG LƯU LOG
    public DbSet<SystemLog> SystemLogs { get; set; } 
    public DbSet<Category> Categories { get; set; }

    // GHI ĐÈ HÀM LƯU DỮ LIỆU ĐỂ TỰ ĐỘNG BẮT LOG
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var auditEntries = new List<AuditEntry>();
        
        // Lấy ID người dùng đang thao tác từ JWT Token (Nếu có)
        var userId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Hệ thống tự động";

        // Quét tất cả các thay đổi trước khi lưu vào DB
        foreach (var entry in ChangeTracker.Entries())
        {
            // Không log chính cái bảng Log, không log các dữ liệu không bị thay đổi
            if (entry.Entity is SystemLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var auditEntry = new AuditEntry(entry)
            {
                TableName = entry.Metadata.GetTableName() ?? "Unknown",
                UserId = userId
            };
            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                string propertyName = property.Metadata.Name;

                // Bỏ qua các khóa ngoại hoặc thuộc tính tạm
                if (property.IsTemporary) continue;

                if (property.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[propertyName] = property.CurrentValue;
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.Action = "INSERT";
                        auditEntry.NewValues[propertyName] = property.CurrentValue;
                        break;
                    case EntityState.Deleted:
                        auditEntry.Action = "DELETE";
                        auditEntry.OldValues[propertyName] = property.OriginalValue;
                        break;
                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.Action = "UPDATE";
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                        }
                        break;
                }
            }
        }

        // 1. Lưu dữ liệu nghiệp vụ trước
        var result = await base.SaveChangesAsync(cancellationToken);

        // 2. Ép kiểu Log và lưu tiếp vào DB
        foreach (var auditEntry in auditEntries)
        {
            SystemLogs.Add(auditEntry.ToSystemLog());
        }

        if (auditEntries.Any())
        {
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }
    
}

// CLASS HỖ TRỢ TRUNG GIAN ĐỂ CHUYỂN ĐỔI DICTIONARY THÀNH JSON
public class AuditEntry
{
    public AuditEntry(EntityEntry entry) { Entry = entry; }
    public EntityEntry Entry { get; }
    public string TableName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public Dictionary<string, object?> KeyValues { get; } = new();
    public Dictionary<string, object?> OldValues { get; } = new();
    public Dictionary<string, object?> NewValues { get; } = new();

    public SystemLog ToSystemLog()
    {
        return new SystemLog
        {
            UserId = UserId,
            Action = Action,
            TableName = TableName,
            Timestamp = DateTime.Now,
            KeyValues = JsonSerializer.Serialize(KeyValues),
            OldValues = OldValues.Count == 0 ? null : JsonSerializer.Serialize(OldValues),
            NewValues = NewValues.Count == 0 ? null : JsonSerializer.Serialize(NewValues)
        };
    }
}