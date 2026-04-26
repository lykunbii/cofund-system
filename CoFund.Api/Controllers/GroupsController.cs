using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Models;

namespace CoFund.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GroupsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // API dùng để tạo một nhóm quỹ mới
    [HttpPost]
    public async Task<ActionResult<Group>> PostGroup(Group group)
    {
        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        return Ok(group);
    }

    // API lấy danh sách các nhóm để xem ID
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Group>>> GetGroups()
    {
        return await _context.Groups.ToListAsync();
    }
}