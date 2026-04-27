using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// --- 1. ĐĂNG KÝ DỊCH VỤ ---
builder.Services.AddControllers();

// Đăng ký DbContext với SQLite
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite("Data Source=cofund.db"));
// Đăng ký Repository Pattern
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
// Cấu hình Swagger theo cách đơn giản nhất cho .NET hiện đại
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Không cần truyền thêm option phức tạp ở đây để tránh lỗi namespace

var app = builder.Build();

// --- 2. CẤU HÌNH PIPELINE ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
        options.RoutePrefix = string.Empty;
    });
}
    
app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();