using Microsoft.AspNetCore.Mvc;
using CoFund.Api.Models;
using CoFund.Api.Repositories;
using CoFund.Api.Data; // THÊM DÒNG NÀY ĐỂ NHẬN DIỆN DATABASE CONTEXT
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace CoFund.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionRepository _repository; 
    private readonly ApplicationDbContext _context; // ĐÃ FIX: Khai báo _context

    // ĐÃ FIX: Tiêm ApplicationDbContext vào Constructor
    public TransactionsController(ITransactionRepository repository, ApplicationDbContext context) 
    {
        _repository = repository;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetTransactions()
    {
        var transactions = await _repository.GetAllTransactionsAsync();
        return Ok(transactions);
    }

    // 🌟 ĐÃ SỬA: Thêm logic Chờ duyệt (Status = 0)
    [HttpPost]
    public async Task<ActionResult<Transaction>> PostTransaction(Transaction transaction)
    {
        try
        {
            // Giao dịch mới tạo mặc định trạng thái là 0 (Pending)
            transaction.Status = 0;
            transaction.TransactionDate = DateTime.Now;

            var newTransaction = await _repository.AddTransactionAsync(transaction);
            
            // Trả về JSON có message để Frontend hiện thông báo
            return Ok(new { 
                Message = "Đã gửi yêu cầu giao dịch, vui lòng chờ Admin duyệt!", 
                Transaction = newTransaction 
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // 🌟 MỚI: Thêm API Phê duyệt giao dịch dành cho Admin
    [HttpPut("{id}/approve")]
    public async Task<IActionResult> ApproveTransaction(int id, [FromQuery] int status) 
    {
        var tx = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id);
        if (tx == null) return NotFound(new { message = "Không tìm thấy giao dịch!" });
        if (tx.Status != 0) return BadRequest(new { message = "Giao dịch này đã được xử lý trước đó." });

        tx.Status = status; // 1: Duyệt, 2: Từ chối

        if (status == 1) // Nếu duyệt mới cập nhật tiền vào quỹ
        {
            var group = await _context.Groups.FindAsync(tx.GroupId);
            if (group != null)
            {
                if (tx.TransactionType == 1) group.CurrentBalance += tx.Amount;
                else group.CurrentBalance -= tx.Amount;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = status == 1 ? "✅ Đã duyệt và cập nhật số dư" : "❌ Đã từ chối giao dịch" });
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
        var group = await _repository.GetGroupByIdAsync(groupId);
        if (group == null) return NotFound("Không tìm thấy quỹ");

        var transactions = await _repository.GetTransactionsByGroupAsync(groupId);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Bao_Cao_Thu_Chi");

        worksheet.Cell(1, 1).Value = "Mã GD";
        worksheet.Cell(1, 2).Value = "Loại Giao Dịch";
        worksheet.Cell(1, 3).Value = "Số Tiền (VNĐ)";
        worksheet.Cell(1, 4).Value = "Ghi Chú";
        worksheet.Cell(1, 5).Value = "Ngày Thực Hiện";
        worksheet.Cell(1, 6).Value = "Người Thực Hiện"; 

        var headerRange = worksheet.Range("A1:F1");
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

        int row = 2;
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
            worksheet.Cell(row, 6).Value = item.UserName; 
            
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

    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetTransactionsByGroup(int groupId)
    {
        var transactions = await _repository.GetTransactionsByGroupAsync(groupId);
        return Ok(transactions);
    }

    [HttpGet("payment-stats/{groupId}")]
    public async Task<IActionResult> GetPaymentStats(int groupId)
    {
        var members = await _repository.GetGroupMembersAsync(groupId);
        
        int totalMembers = members.Count();
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

    public class SendReminderRequest
    {
        public int AdminUserId { get; set; }
        public int TargetUserId { get; set; }
        public int GroupId { get; set; }
    }

    [HttpPost("send-inapp-reminder")]
    public async Task<IActionResult> SendInAppReminder([FromBody] SendReminderRequest request)
    {
        try
        {
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

    public class BankInfoRequest
    {
        public required string BankBin { get; set; }
        public required string BankAccountNumber { get; set; }
        public required string BankAccountName { get; set; }
    }

    // API cho Admin Cấu hình Ngân hàng
    [HttpPut("group/{groupId}/bank-info")]
    public async Task<IActionResult> UpdateBankInfo(int groupId, [FromBody] BankInfoRequest request)
    {
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null) return NotFound("Không tìm thấy quỹ!");

        group.BankBin = request.BankBin;
        group.BankAccountNumber = request.BankAccountNumber;
        group.BankAccountName = request.BankAccountName.ToUpper(); 

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật tài khoản nhận tiền thành công!", group });
    }

    // API sinh mã QR động cho Member
    [HttpGet("payment-qr/{groupId}")]
    public async Task<IActionResult> GetPaymentQR(int groupId, [FromQuery] decimal amount, [FromQuery] string note)
    {
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null) return NotFound("Không tìm thấy quỹ!");

        if (string.IsNullOrEmpty(group.BankAccountNumber) || string.IsNullOrEmpty(group.BankBin))
        {
            return BadRequest(new { message = "Thủ quỹ chưa cấu hình Tài khoản Ngân hàng nhận tiền. Vui lòng liên hệ Admin!" });
        }

        string cleanNote = Uri.EscapeDataString(note ?? $"Nop quy {group.Name}");
        string cleanName = Uri.EscapeDataString(group.BankAccountName ?? "");
        
        string qrUrl = $"https://img.vietqr.io/image/{group.BankBin}-{group.BankAccountNumber}-compact2.png?amount={amount}&addInfo={cleanNote}&accountName={cleanName}";

        return Ok(new { qrUrl });
    }
    // ==========================================
    // 🤖 CHATBOT AI: CỐ VẤN TÀI CHÍNH TƯƠNG TÁC
    // ==========================================
    public class ChatRequest { 
        public string Message { get; set; } = string.Empty;
        // Bạn có thể mở rộng thêm mảng History nếu muốn chatbot nhớ câu trước
    }

    [HttpPost("ai-chat/{groupId}")]
    public async Task<IActionResult> FinanceChat(int groupId, [FromBody] ChatRequest request, [FromServices] IConfiguration config)
    {
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null) return NotFound("Quỹ không tồn tại.");

        // 1. Lấy dữ liệu thực tế làm "vũ khí" cho AI
        var txs = await _context.Transactions
            .Where(t => t.GroupId == groupId && t.Status == 1)
            .OrderByDescending(t => t.TransactionDate)
            .Take(20) // Lấy 20 giao dịch gần nhất
            .ToListAsync();

        string historyData = string.Join("\n", txs.Select(t => 
            $"- {(t.TransactionType == 1 ? "Thu" : "Chi")}: {t.Amount:N0}đ | Nội dung: {t.Note} | Ngày: {t.TransactionDate:dd/MM}"));

        // 2. Thiết lập "Nhân cách" cho AI (System Prompt)
        string systemInstruction = $@"
            Bạn là 'CoFund Bot' - Cố vấn tài chính thông minh cho quỹ nhóm '{group.Name}'.
            DỮ LIỆU HIỆN TẠI:
            - Số dư: {group.CurrentBalance:N0}đ
            - Mục tiêu: {group.TargetAmount:N0}đ
            - Lịch sử gần đây:
            {historyData}

            NHIỆM VỤ:
            - Trả lời các câu hỏi của người dùng dựa trên dữ liệu trên.
            - Tư vấn cách chi tiêu hợp lý, cảnh báo nếu chi tiêu quá đà.
            - Trả lời ngắn gọn, thân thiện, dùng icon phù hợp. 
            - Trả lời bằng tiếng Việt. Dùng định dạng HTML (<b>, <br>) để trình bày.
        ";

        // 3. Gọi Gemini API
        var apiKey = config["GeminiApiKey"];
        using var client = new HttpClient();
        var requestBody = new {
            contents = new[] { 
                new { role = "user", parts = new[] { new { text = $"{systemInstruction}\n\nNgười dùng hỏi: {request.Message}" } } } 
            }
        };

        var response = await client.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}", requestBody);
        
        // --- BẮT ĐẦU ĐOẠN LOG ĐIỀU TRA HIỆN TRƯỜNG ---
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine("\n=========================================");
            Console.WriteLine($"[LỖI TỪ GOOGLE GEMINI]: {response.StatusCode}");
            Console.WriteLine(errorContent);
            Console.WriteLine("=========================================\n");
            return BadRequest(new { Reply = $"Lỗi từ Google: {response.StatusCode} - {errorContent}" });
        }

        // 1. Đọc dữ liệu trả về dưới dạng chuỗi Text thô
        var jsonString = await response.Content.ReadAsStringAsync();
        
        Console.WriteLine("\n=========================================");
        Console.WriteLine("[PHẢN HỒI THÀNH CÔNG TỪ GOOGLE]:");
        Console.WriteLine(jsonString);
        Console.WriteLine("=========================================\n");
        // --- KẾT THÚC ĐOẠN LOG ĐIỀU TRA ---

        // 2. Dùng JsonNode để bóc tách dữ liệu an toàn
        var jsonNode = System.Text.Json.Nodes.JsonNode.Parse(jsonString);
        
        // 3. Lấy text ra (Dùng dấu ? để tránh lỗi sập server nếu thiếu trường)
        string reply = jsonNode?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString() 
                       ?? "Hệ thống AI không trả về câu trả lời hợp lệ.";

        return Ok(new { Reply = reply });
    }
}
