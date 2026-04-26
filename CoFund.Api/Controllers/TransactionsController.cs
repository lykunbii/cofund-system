using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Models;
using ClosedXML.Excel;
using System.IO;

namespace CoFund.Api.Controllers;

[ApiController]
[Route("api/[controller]")] // Đường dẫn sẽ là: api/transactions
public class TransactionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    // Dependency Injection: Tiêm Database vào để sử dụng
    public TransactionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // API: Lấy danh sách tất cả giao dịch đóng quỹ
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetTransactions()
    {
        return await _context.Transactions
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new {
                t.Id,
                t.Amount,
                t.Note,
                t.TransactionDate,
                t.TransactionType, // Bắt buộc phải thêm dòng này
                UserName = "Nguyễn Thị Lý" 
            })
            .ToListAsync();
    }

    // API: Thực hiện đóng tiền vào quỹ
    [HttpPost]
    public async Task<ActionResult<Transaction>> PostTransaction(Transaction transaction)
    {
        // 1. Kiểm tra xem Quỹ (Group) này có tồn tại không
        var group = await _context.Groups.FindAsync(transaction.GroupId);
        if (group == null)
        {
            return NotFound("Không tìm thấy thông tin quỹ!");
        }

        // 2. Logic xử lý Thu / Chi
        if (transaction.TransactionType == 1) 
        {
            // Loại 1: Nộp tiền -> Cộng vào số dư quỹ
            group.CurrentBalance += transaction.Amount;
        }
        else if (transaction.TransactionType == 2)
        {
            // Loại 2: Rút tiền -> Phải kiểm tra xem quỹ có đủ tiền không
            if (group.CurrentBalance < transaction.Amount)
            {
                return BadRequest("Số dư quỹ không đủ để thực hiện khoản chi này!");
            }
            // Trừ tiền khỏi số dư quỹ
            group.CurrentBalance -= transaction.Amount;
        }
        else
        {
            return BadRequest("Loại giao dịch không hợp lệ!");
        }

        // 3. Đảm bảo thời gian giao dịch là thời điểm hiện tại
        transaction.TransactionDate = DateTime.Now;

        // 4. Lưu giao dịch và cập nhật số dư Quỹ vào Database cùng một lúc (Transaction)
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
    }
    [HttpGet("group-total/{groupId}")]
    public async Task<ActionResult<decimal>> GetGroupTotal(int groupId)
    {
        // Sử dụng LINQ để lọc và tính tổng
        var total = await _context.Transactions
            .Where(t => t.GroupId == groupId) // Lọc theo nhóm
            .SumAsync(t => t.Amount);         // Cộng dồn tất cả số tiền

        return Ok(new { GroupId = groupId, TotalAmount = total });
    }
    [HttpGet("goal-progress/{groupId}")]
    public async Task<ActionResult> GetGoalProgress(int groupId)
    {
        // 1. Tìm thông tin nhóm
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null) return NotFound("Không tìm thấy quỹ");

        // 2. SỬA BUG TẠI ĐÂY: Lấy số dư trực tiếp từ CurrentBalance
        var currentAmount = group.CurrentBalance; 
        
        // 3. Tính toán %
        var progressPercentage = group.TargetAmount > 0 
            ? Math.Round(((decimal)currentAmount / group.TargetAmount) * 100, 2) 
            : 0;

        // 4. Tính số tiền còn thiếu (nếu rút tiền thì báo thiếu nhiều hơn)
        var remainingAmount = group.TargetAmount > currentAmount 
            ? group.TargetAmount - currentAmount 
            : 0;

        return Ok(new {
            GroupName = group.Name,
            Target = group.TargetAmount,
            Current = currentAmount, // Trả về số dư chuẩn
            ProgressPercentage = progressPercentage,
            IsGoalAchieved = currentAmount >= group.TargetAmount,
            RemainingAmount = remainingAmount
        });
    }
    [HttpGet("export/{groupId}")]
    public async Task<IActionResult> ExportToExcel(int groupId)
    {
        // 1. Lấy thông tin nhóm và lịch sử giao dịch
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null) return NotFound("Không tìm thấy quỹ");

        var transactions = await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();

        // 2. Khởi tạo file Excel
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Bao_Cao_Thu_Chi");

        // 3. Tạo Tiêu đề (Header)
        worksheet.Cell(1, 1).Value = "Mã GD";
        worksheet.Cell(1, 2).Value = "Loại Giao Dịch";
        worksheet.Cell(1, 3).Value = "Số Tiền (VNĐ)";
        worksheet.Cell(1, 4).Value = "Ghi Chú";
        worksheet.Cell(1, 5).Value = "Ngày Thực Hiện";

        // Format in đậm và tô nền xám cho Header
        var headerRange = worksheet.Range("A1:E1");
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

        // 4. Đổ dữ liệu vào bảng
        int row = 2;
        foreach (var item in transactions)
        {
            worksheet.Cell(row, 1).Value = item.Id;
            
            // Phân loại Thu / Chi và tô màu chữ
            var typeCell = worksheet.Cell(row, 2);
            if (item.TransactionType == 1) {
                typeCell.Value = "Thu vào";
                typeCell.Style.Font.FontColor = XLColor.Green;
            } else {
                typeCell.Value = "Rút ra";
                typeCell.Style.Font.FontColor = XLColor.Red;
            }

            // Ghi số tiền và format dấu phẩy (VD: 50,000)
            var amountCell = worksheet.Cell(row, 3);
            amountCell.Value = item.Amount;
            amountCell.Style.NumberFormat.Format = "#,##0";
            
            worksheet.Cell(row, 4).Value = item.Note;
            worksheet.Cell(row, 5).Value = item.TransactionDate.ToString("dd/MM/yyyy HH:mm");
            
            row++;
        }

        // 5. Thêm dòng Tổng kết số dư ở cuối bảng
        worksheet.Cell(row, 2).Value = "SỐ DƯ HIỆN TẠI:";
        worksheet.Cell(row, 2).Style.Font.Bold = true;
        
        worksheet.Cell(row, 3).Value = group.CurrentBalance;
        worksheet.Cell(row, 3).Style.Font.Bold = true;
        worksheet.Cell(row, 3).Style.NumberFormat.Format = "#,##0";
        worksheet.Cell(row, 3).Style.Font.FontColor = XLColor.Blue;

        // Tự động căn chỉnh độ rộng các cột cho vừa chữ
        worksheet.Columns().AdjustToContents();

        // 6. Đóng gói và trả file về cho React
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        string fileName = $"BaoCao_Quy_{group.Name}_{DateTime.Now:ddMMyyyy}.xlsx";
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}