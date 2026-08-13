using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Auth;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 认证控制器：负责玩家账号注册、登录、JWT 令牌刷新与退出登录流程
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : AppControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// 玩家账号登录：验证用户名密码并返回访问令牌与刷新令牌
    /// </summary>
    /// <param name="request">登录请求参数，包含用户名和密码</param>
    /// <returns>登录成功返回 TokenOutput（含 AccessToken、RefreshToken 等），失败返回错误信息</returns>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginInput request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Fail<TokenOutput>("用户名或密码不能为空");
        }

        var result = await _authService.LoginAsync(request);
        if (result == null)
        {
            return Fail<TokenOutput>("用户名或密码错误");
        }

        return Success(result, "登录成功");
    }

    /// <summary>
    /// 玩家账号注册：创建新玩家账号并自动登录返回令牌
    /// </summary>
    /// <param name="request">注册请求参数，包含用户名、密码及可选昵称头像</param>
    /// <returns>注册成功返回 TokenOutput（含 AccessToken、RefreshToken 等），失败返回错误信息</returns>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterInput request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Fail<TokenOutput>("用户名、密码不能为空");
        }

        var result = await _authService.RegisterAsync(request);
        if (result == null)
        {
            return Fail<TokenOutput>("注册失败，用户名可能已存在");
        }

        return Success(result, "注册成功");
    }

    /// <summary>
    /// 刷新访问令牌：使用有效的 RefreshToken 获取新的 AccessToken 和 RefreshToken
    /// </summary>
    /// <param name="request">刷新令牌请求参数，包含当前的 RefreshToken</param>
    /// <returns>刷新成功返回新的 TokenOutput，失败返回错误信息</returns>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenInput request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Fail<TokenOutput>("refreshToken 不能为空");
        }

        var result = await _authService.RefreshTokenAsync(request);
        if (result == null)
        {
            return Fail<TokenOutput>("无效的 refreshToken");
        }

        return Success(result, "刷新成功");
    }

    /// <summary>
    /// 退出登录：通知前端清除本地令牌完成登出流程（JWT 无状态，接口仅供流程调用）
    /// </summary>
    /// <returns>返回登出成功确认信息</returns>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // JWT 无状态，前端清除 token 即可；此接口供前端调用完成退出流程
        return Success("已退出登录");
    }
}
