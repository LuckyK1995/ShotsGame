using ShotsGame.Core.DTOs.Auth;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 认证服务接口，负责玩家登录、注册与令牌刷新等身份验证业务
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// 使用用户名和密码登录玩家账号，返回访问令牌
    /// </summary>
    /// <param name="request">登录请求参数（包含用户名、密码）</param>
    /// <returns>登录成功的访问令牌与刷新令牌，若失败则返回 null</returns>
    Task<TokenOutput?> LoginAsync(LoginInput request);

    /// <summary>
    /// 使用用户名和密码注册新玩家账号并自动登录
    /// </summary>
    /// <param name="request">注册请求参数（包含用户名、密码、邮箱等）</param>
    /// <returns>注册成功的访问令牌与刷新令牌，若失败则返回 null</returns>
    Task<TokenOutput?> RegisterAsync(RegisterInput request);

    /// <summary>
    /// 使用刷新令牌获取新的访问令牌
    /// </summary>
    /// <param name="request">刷新令牌请求参数（包含过期访问令牌与有效刷新令牌）</param>
    /// <returns>新的访问令牌与刷新令牌，若失败则返回 null</returns>
    Task<TokenOutput?> RefreshTokenAsync(RefreshTokenInput request);
}
