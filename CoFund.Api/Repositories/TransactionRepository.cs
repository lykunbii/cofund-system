using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Models;

namespace CoFund.Api.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly ApplicationDbContext _context;

    // Tiêm (Inject) DbContext vào đây
    public TransactionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<object>> GetAllTransactionsAsync()
    {
        return await _context.Transactions
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new {
                t.Id,
                t.Amount,
                t.Note,
                t.TransactionDate,
                t.TransactionType,
                UserName = "Nguyễn Thị Lý" 
            })
            .ToListAsync();
    }

    public async Task<Transaction> AddTransactionAsync(Transaction transaction)
    {
        var group = await _context.Groups.FindAsync(transaction.GroupId);
        if (group == null) throw new Exception("Không tìm thấy thông tin quỹ!");

        // Logic Thu/Chi
        if (transaction.TransactionType == 1) 
        {
            group.CurrentBalance += transaction.Amount;
        }
        else if (transaction.TransactionType == 2)
        {
            if (group.CurrentBalance < transaction.Amount)
                throw new Exception("Số dư quỹ không đủ để thực hiện khoản chi này!");
            
            group.CurrentBalance -= transaction.Amount;
        }
        else
        {
            throw new Exception("Loại giao dịch không hợp lệ!");
        }

        transaction.TransactionDate = DateTime.Now;
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return transaction;
    }
    public async Task<Group?> GetGroupByIdAsync(int groupId)
    {
        return await _context.Groups.FindAsync(groupId);
    }

    public async Task<decimal> GetGroupTotalAsync(int groupId)
    {
        return await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .SumAsync(t => t.Amount);
    }

    public async Task<IEnumerable<Transaction>> GetTransactionsByGroupAsync(int groupId)
    {
        return await _context.Transactions
            .Where(t => t.GroupId == groupId)
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();
    }
}