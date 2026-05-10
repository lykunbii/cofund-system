using Microsoft.AspNetCore.SignalR;

namespace CoFund.Api.Hubs;

// Lớp này đóng vai trò như một trạm phát sóng trung tâm
public class NotificationHub : Hub
{
    // Bạn có thể để trống, hoặc viết thêm logic khi có người kết nối/ngắt kết nối
    public override Task OnConnectedAsync()
    {
        Console.WriteLine($"[SignalR] Client connected: {Context.ConnectionId}");
        return base.OnConnectedAsync();
    }
}