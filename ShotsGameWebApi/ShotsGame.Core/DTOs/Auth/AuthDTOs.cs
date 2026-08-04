namespace ShotsGame.Core.DTOs.Auth;

// ─── 入参 ───

/// <summary>
/// 登录入参
/// </summary>
public class LoginInput
{
    /// <summary>
    /// 登录用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 登录密码
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 是否自动登录（记住登录状态）
    /// </summary>
    public bool AutoLogin { get; set; }
}

/// <summary>
/// 注册入参
/// </summary>
public class RegisterInput
{
    /// <summary>
    /// 注册用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 注册密码
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 玩家显示昵称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 绑定邮箱（可选）
    /// </summary>
    public string? Email { get; set; }
}

/// <summary>
/// 刷新令牌入参
/// </summary>
public class RefreshTokenInput
{
    /// <summary>
    /// 刷新令牌（Refresh Token）
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;
}

// ─── 出参 ───

/// <summary>
/// Token 出参
/// </summary>
public class TokenOutput
{
    /// <summary>
    /// 访问令牌（Access Token，用于接口鉴权）
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// 刷新令牌（用于换取新的访问令牌）
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// 访问令牌过期时间（秒）
    /// </summary>
    public long ExpiresIn { get; set; }
}
