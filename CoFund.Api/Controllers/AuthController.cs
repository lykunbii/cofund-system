using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoFund.Api.Data;
using CoFund.Api.Models;

namespace CoFund.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Kiểm tra xem email đã tồn tại chưa
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("Email này đã được đăng ký trong hệ thống!");

        var newUser = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            Password = request.Password 
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Đăng ký thành công!", User = newUser });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Tìm user khớp email và mật khẩu
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Password == request.Password);

        if (user == null)
            return BadRequest("Email hoặc mật khẩu không chính xác!");

        return Ok(new { Message = "Đăng nhập thành công!", User = user });
    }
}