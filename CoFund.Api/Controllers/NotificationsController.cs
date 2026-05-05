using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Models;

namespace CoFund.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // 1. API Lấy danh sách thông báo của 1 user
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserNotifications(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20) // Chỉ lấy 20 thông báo gần nhất cho nhẹ
            .ToListAsync();
            
        return Ok(notifications);
    }

    // 2. API Đánh dấu đã đọc
    [HttpPut("mark-read/{notificationId}")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        var notif = await _context.Notifications.FindAsync(notificationId);
        if (notif != null)
        {
            notif.IsRead = true;
            await _context.SaveChangesAsync();
        }
        return Ok();
    }

    // 3. API Gửi thông báo (Dùng cho nút Nhắc nhở)
    [HttpPost("send")]
    public async Task<IActionResult> SendNotification([FromBody] Notification request)
    {
        _context.Notifications.Add(request);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã gửi thông báo!" });
    }
}