using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ShotsGame.Core.Entities;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// JWT 令牌服务：负责生成访问令牌、刷新令牌及令牌校验解析
/// </summary>
public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    /// <summary>
    /// 生成访问令牌（使用配置中的默认过期时间）
    /// </summary>
    /// <param name="player">玩家实体对象</param>
    /// <returns>JWT 访问令牌字符串</returns>
    public string GenerateAccessToken(Player player)
    {
        var expiresMinutes = int.Parse(_config["Jwt:ExpiresMinutes"] ?? "120");
        return GenerateAccessToken(player, TimeSpan.FromMinutes(expiresMinutes));
    }

    /// <summary>
    /// 生成访问令牌（指定过期时间）
    /// </summary>
    /// <param name="player">玩家实体对象</param>
    /// <param name="expiresIn">令牌有效期</param>
    /// <returns>JWT 访问令牌字符串</returns>
    public string GenerateAccessToken(Player player, TimeSpan expiresIn)
    {
        var issuer = _config["Jwt:Issuer"] ?? "ShotsGame";
        var audience = _config["Jwt:Audience"] ?? "ShotsGame.Client";
        var secretKey = _config["Jwt:SecretKey"]!;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, player.Id),
            new(ClaimTypes.Name, player.Username),
            new("DisplayName", player.DisplayName)
        };

        if (!string.IsNullOrEmpty(player.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, player.Email));
        }

        var token = new JwtSecurityTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = issuer,
            Audience = audience,
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.Add(expiresIn),
            SigningCredentials = creds
        });

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 生成刷新令牌（带签名的 JWT 格式，包含玩家 ID 与过期时间，防止伪造）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>刷新令牌字符串（带签名的 JWT）</returns>
    public string GenerateRefreshToken(string playerId)
    {
        var issuer = _config["Jwt:Issuer"] ?? "ShotsGame";
        var audience = _config["Jwt:Audience"] ?? "ShotsGame.Client";
        var secretKey = _config["Jwt:SecretKey"]!;
        var refreshDays = double.Parse(_config["Jwt:RefreshExpiresDays"] ?? "7");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, playerId),
            new("token_type", "refresh")
        };

        var token = new JwtSecurityTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = issuer,
            Audience = audience,
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(refreshDays),
            SigningCredentials = creds
        });

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 校验访问令牌的有效性并返回 ClaimsPrincipal
    /// </summary>
    /// <param name="token">JWT 访问令牌</param>
    /// <returns>校验成功返回 ClaimsPrincipal，失败返回 null</returns>
    public ClaimsPrincipal? ValidateToken(string token)
    {
        var issuer = _config["Jwt:Issuer"] ?? "ShotsGame";
        var audience = _config["Jwt:Audience"] ?? "ShotsGame.Client";
        var secretKey = _config["Jwt:SecretKey"]!;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secretKey);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.FromSeconds(30)
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// 从访问令牌中解析用户 ID 和用户名
    /// </summary>
    /// <param name="token">JWT 访问令牌</param>
    /// <returns>元组 (UserId, Username)，解析失败返回 (null, null)</returns>
    public (string? UserId, string? Username) GetUserFromToken(string token)
    {
        var principal = ValidateToken(token);
        if (principal == null)
            return (null, null);

        var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                   ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = principal.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value
                    ?? principal.FindFirst(ClaimTypes.Name)?.Value;

        return (userId, username);
    }

    /// <summary>
    /// 从刷新令牌中提取玩家 ID（校验签名与过期时间，失败返回 null）
    /// </summary>
    /// <param name="refreshToken">刷新令牌字符串（带签名的 JWT）</param>
    /// <returns>玩家 ID，校验失败返回 null</returns>
    public string? GetUserIdFromRefreshToken(string refreshToken)
    {
        var principal = ValidateToken(refreshToken);
        if (principal == null)
        {
            return null;
        }

        // 必须包含 token_type=refresh 声明，防止 access token 被误用为 refresh token
        var tokenType = principal.FindFirst("token_type")?.Value;
        if (tokenType != "refresh")
        {
            return null;
        }

        return principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
