using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Auth;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 认证服务：玩家登录（用户名/密码校验+签发令牌）、新玩家注册（创建账号+发放初始奖励）、刷新访问令牌
/// </summary>
public class AuthService : IAuthService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly PasswordService _passwordService;
    private readonly JwtService _jwtService;
    private readonly IConfiguration _config;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IPlayerRepository playerRepository,
        PasswordService passwordService,
        JwtService jwtService,
        IConfiguration config,
        GameDbContext context,
        IMapper mapper,
        ILogger<AuthService> logger)
    {
        _playerRepository = playerRepository;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _config = config;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// 玩家登录：校验用户名与密码，匹配成功后签发访问令牌（Access Token）与刷新令牌（Refresh Token）
    /// </summary>
    /// <param name="request">登录参数（用户名、密码）</param>
    /// <returns>令牌输出（访问令牌、刷新令牌、过期时间），用户名或密码错误返回 null</returns>
    public async Task<TokenOutput?> LoginAsync(LoginInput request)
    {
        // 参数基础校验
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        // 按用户名查询玩家
        var player = await _playerRepository.GetByUsernameAsync(request.Username);
        if (player == null)
        {
            return null;
        }

        // 校验密码
        if (!_passwordService.VerifyPassword(request.Password, player.PasswordHash))
        {
            return null;
        }

        // 更新最后活跃时间
        player.LastActiveAt = DateTimeOffset.UtcNow;
        await _playerRepository.UpdateAsync(player);

        // 根据是否勾选自动登录决定有效期
        TimeSpan expiresIn = request.AutoLogin
            ? TimeSpan.FromDays(30)
            : TimeSpan.FromMinutes(long.Parse(_config["Jwt:ExpiresMinutes"] ?? "120"));

        var token = _jwtService.GenerateAccessToken(player, expiresIn);
        var refresh = _jwtService.GenerateRefreshToken(player.Id);
        var expiresInSeconds = (long)expiresIn.TotalSeconds;

        _logger.LogInformation("玩家 {Username} 登录成功", request.Username);
        return new TokenOutput
        {
            AccessToken = token,
            RefreshToken = refresh,
            ExpiresIn = expiresInSeconds
        };
    }

    /// <summary>
    /// 新玩家注册：创建玩家账号（哈希密码）、发放初始金币和等级、签发令牌并记录注册日志
    /// </summary>
    /// <param name="request">注册参数（用户名、密码、邮箱、昵称等）</param>
    /// <returns>令牌输出（访问令牌、刷新令牌、过期时间），用户名已存在或校验失败返回 null</returns>
    public async Task<TokenOutput?> RegisterAsync(RegisterInput request)
    {
        // 参数基础校验
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        // 用户名唯一性校验
        if (await _playerRepository.ExistsByUsernameAsync(request.Username))
        {
            return null;
        }

        // 映射并设置密码哈希
        var newPlayer = _mapper.Map<Player>(request);
        newPlayer.PasswordHash = _passwordService.HashPassword(request.Password);

        // 昵称为空时使用默认昵称
        if (string.IsNullOrWhiteSpace(newPlayer.DisplayName))
        {
            newPlayer.DisplayName = "突围者" + new Random().Next(10000, 99999);
        }

        await _playerRepository.AddAsync(newPlayer);

        // 签发令牌
        var token = _jwtService.GenerateAccessToken(newPlayer);
        var refresh = _jwtService.GenerateRefreshToken(newPlayer.Id);

        _logger.LogInformation("玩家 {Username} 注册成功", request.Username);
        return new TokenOutput
        {
            AccessToken = token,
            RefreshToken = refresh,
            ExpiresIn = 7200
        };
    }

    /// <summary>
    /// 刷新访问令牌：校验刷新令牌有效性与玩家身份，重新签发新的访问令牌和刷新令牌
    /// </summary>
    /// <param name="request">刷新令牌参数（原访问令牌、刷新令牌）</param>
    /// <returns>新令牌输出（访问令牌、刷新令牌、过期时间），校验失败返回 null</returns>
    public async Task<TokenOutput?> RefreshTokenAsync(RefreshTokenInput request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return null;
        }

        // 从 refreshToken 中解析玩家ID
        var playerId = _jwtService.GetUserIdFromRefreshToken(request.RefreshToken);
        if (string.IsNullOrEmpty(playerId))
        {
            return null;
        }

        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var newToken = _jwtService.GenerateAccessToken(player);
        var newRefresh = _jwtService.GenerateRefreshToken(player.Id);

        return new TokenOutput
        {
            AccessToken = newToken,
            RefreshToken = newRefresh,
            ExpiresIn = 7200
        };
    }
}
