using Microsoft.AspNetCore.Mvc;
using CoFund.Api.Models;
using CoFund.Api.Repositories;
using ClosedXML.Excel;

namespace CoFund.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TransactionsController : ControllerBase
{
    // CỘT SỐNG DUY NHẤT: REPOSITORY
    private readonly ITransactionRepository _repository; 

    public TransactionsController(ITransactionRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetTransactions()
    {
        var transactions = await _repository.GetAllTransactionsAsync();
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<ActionResult<Transaction>> PostTransaction(Transaction transaction)
    {
        try
        {
            var newTransaction = await _repository.AddTransactionAsync(transaction);
            return CreatedAtAction(nameof(GetTransactions), new { id = newTransaction.Id }, newTransaction);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("group-total/{groupId}")]
    public async Task<ActionResult<decimal>> GetGroupTotal(int groupId)
    {
        var total = await _repository.GetGroupTotalAsync(groupId);
        return Ok(new { GroupId = groupId, TotalAmount = total });
    }

    [HttpGet("goal-progress/{groupId}")]
    public async Task<ActionResult> GetGoalProgress(int groupId)
    {
        var group = await _repository.GetGroupByIdAsync(groupId);
        if (group == null) return NotFound("Không tìm thấy quỹ");

        var currentAmount = group.CurrentBalance; 
        
        var progressPercentage = group.TargetAmount > 0 
            ? Math.Round(((decimal)currentAmount / group.TargetAmount) * 100, 2) 
            : 0;

        var remainingAmount = group.TargetAmount > currentAmount 
            ? group.TargetAmount - currentAmount 
            : 0;

        return Ok(new {
            GroupName = group.Name,
            Target = group.TargetAmount,
            Current = currentAmount, 
            ProgressPercentage = progressPercentage,
            IsGoalAchieved = currentAmount >= group.TargetAmount,
            RemainingAmount = remainingAmount
        });
    }

    [HttpGet("export/{groupId}")]
    public async Task<IActionResult> ExportToExcel(int groupId)
    {
        // 1. Lấy dữ liệu thông qua Repository (Không chạm vào DbContext)
        var group = await _repository.GetGroupByIdAsync(groupId);
        if (group == null) return NotFound("Không tìm thấy quỹ");

        var transactions = await _repository.GetTransactionsByGroupAsync(groupId);

        // 2. Logic tạo Excel
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Bao_Cao_Thu_Chi");

        worksheet.Cell(1, 1).Value = "Mã GD";
        worksheet.Cell(1, 2).Value = "Loại Giao Dịch";
        worksheet.Cell(1, 3).Value = "Số Tiền (VNĐ)";
        worksheet.Cell(1, 4).Value = "Ghi Chú";
        worksheet.Cell(1, 5).Value = "Ngày Thực Hiện";
        worksheet.Cell(1, 6).Value = "Người Thực Hiện"; // Thêm cột Tên người nộp

        var headerRange = worksheet.Range("A1:F1");
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

        int row = 2;
        // SỬ DỤNG DYNAMIC ĐỂ FIX LỖI CS1061 CỦA C#
        foreach (dynamic item in transactions)
        {
            worksheet.Cell(row, 1).Value = item.Id;
            
            var typeCell = worksheet.Cell(row, 2);
            if (item.TransactionType == 1) {
                typeCell.Value = "Thu vào";
                typeCell.Style.Font.FontColor = XLColor.Green;
            } else {
                typeCell.Value = "Rút ra";
                typeCell.Style.Font.FontColor = XLColor.Red;
            }

            var amountCell = worksheet.Cell(row, 3);
            amountCell.Value = item.Amount;
            amountCell.Style.NumberFormat.Format = "#,##0";
            
            worksheet.Cell(row, 4).Value = item.Note;
            worksheet.Cell(row, 5).Value = item.TransactionDate.ToString("dd/MM/yyyy HH:mm");
            worksheet.Cell(row, 6).Value = item.UserName; // Xuất luôn tên người nộp ra Excel
            
            row++;
        }

        worksheet.Cell(row, 2).Value = "SỐ DƯ HIỆN TẠI:";
        worksheet.Cell(row, 2).Style.Font.Bold = true;
        
        worksheet.Cell(row, 3).Value = group.CurrentBalance;
        worksheet.Cell(row, 3).Style.Font.Bold = true;
        worksheet.Cell(row, 3).Style.NumberFormat.Format = "#,##0";
        worksheet.Cell(row, 3).Style.Font.FontColor = XLColor.Blue;

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        string fileName = $"BaoCao_Quy_{group.Name}_{DateTime.Now:ddMMyyyy}.xlsx";
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("payment-qr")]
    public IActionResult GetPaymentQr([FromQuery] decimal amount, [FromQuery] string note)
    {
        if (amount <= 0)
        {
            return BadRequest("Số tiền không hợp lệ.");
        }

        if (string.IsNullOrEmpty(note))
        {
            note = "Nop tien quy"; 
        }

        var qrUrl = _repository.GeneratePaymentQrUrl(amount, note);
        return Ok(new { QrUrl = qrUrl });
    }

    [HttpPost("join-group")]
    public async Task<IActionResult> JoinGroup([FromBody] JoinGroupRequest request)
    {
        try
        {
            var newMember = await _repository.JoinGroupAsync(request.UserId, request.JoinCode);
            return Ok(new { 
                Message = "🎉 Tham gia quỹ thành công!", 
                Member = newMember 
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpPost("create-group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Name))
                return BadRequest("Tên quỹ không được để trống!");

            var newGroup = await _repository.CreateGroupAsync(request);
            return Ok(new { 
                Message = "Tạo quỹ thành công!", 
                Group = newGroup 
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("user-groups/{userId}")]
    public async Task<IActionResult> GetUserGroups(int userId)
    {
        try
        {
            var groups = await _repository.GetUserGroupsAsync(userId);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("group-members/{groupId}")]
    public async Task<IActionResult> GetGroupMembers(int groupId)
    {
        var members = await _repository.GetGroupMembersAsync(groupId);
        return Ok(members);
    }

    // ĐÂY LÀ API GIẢI QUYẾT LỖI 404 CỦA BẠN
    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetTransactionsByGroup(int groupId)
    {
        var transactions = await _repository.GetTransactionsByGroupAsync(groupId);
        return Ok(transactions);
    }
    [HttpGet("payment-stats/{groupId}")]
    public async Task<IActionResult> GetPaymentStats(int groupId)
    {
        // Sử dụng _repository để lấy danh sách thành viên (nhớ rằng GetGroupMembersAsync trả về mảng object)
        var members = await _repository.GetGroupMembersAsync(groupId);
        
        // C# LINQ: Đếm số lượng
        int totalMembers = members.Count();
        
        // Vì members là danh sách dynamic/object (chứa IsPaid), ta dùng cách này để đếm an toàn:
        int paidCount = 0;
        foreach(dynamic m in members)
        {
            if (m.IsPaid == true) paidCount++;
        }
        
        int unpaidCount = totalMembers - paidCount;

        return Ok(new[] {
            new { Name = "Đã nộp", Value = paidCount, Color = "#10b981" },
            new { Name = "Chưa nộp", Value = unpaidCount, Color = "#ef4444" }
        });
    }
    // 1. THÊM CLASS NÀY NGAY BÊN TRONG (HOẶC CUỐI) CONTROLLER:
    public class SendReminderRequest
    {
        public int AdminUserId { get; set; }
        public int TargetUserId { get; set; }
        public int GroupId { get; set; }
    }

    // 2. SỬA LẠI API THÀNH NHƯ SAU (Thay thế đoạn cũ):
    [HttpPost("send-inapp-reminder")]
    public async Task<IActionResult> SendInAppReminder([FromBody] SendReminderRequest request)
    {
        try
        {
            // Bây giờ C# đã hiểu chuẩn xác các trường dữ liệu
            await _repository.SendInAppReminderAsync(request.AdminUserId, request.TargetUserId, request.GroupId);
            return Ok(new { Message = "Đã gửi thông báo đến thành viên!" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message }); 
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("notifications/{userId}")]
    public async Task<IActionResult> GetNotifications(int userId)
    {
        var notis = await _repository.GetUserNotificationsAsync(userId);
        return Ok(notis);
    }

    [HttpPut("notifications/{id}/read")]
    public async Task<IActionResult> MarkNotificationRead(int id)
    {
        await _repository.MarkNotificationAsReadAsync(id);
        return Ok();
    }
}