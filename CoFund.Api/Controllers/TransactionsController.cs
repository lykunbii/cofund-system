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

        var headerRange = worksheet.Range("A1:E1");
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

        int row = 2;
        foreach (var item in transactions)
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
            note = "Nop tien quy"; // Ghi chú mặc định nếu để trống
        }

        // Gọi Repository để lấy link QR
        var qrUrl = _repository.GeneratePaymentQrUrl(amount, note);
        
        return Ok(new { QrUrl = qrUrl });
    }
    [HttpPost("join-group")]
    public async Task<IActionResult> JoinGroup([FromBody] JoinGroupRequest request)
    {
        try
        {
            // Chuyển "tờ phiếu đăng ký" xuống cho Repository xử lý
            var newMember = await _repository.JoinGroupAsync(request.UserId, request.JoinCode);
            
            return Ok(new { 
                Message = "🎉 Tham gia quỹ thành công!", 
                Member = newMember 
            });
        }
        catch (Exception ex)
        {
            // Bắt lỗi (Ví dụ: Mã sai, hoặc đã tham gia rồi) và báo về cho React
            return BadRequest(new { Error = ex.Message });
        }
    }
}