using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Player;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 玩家控制器：负责玩家个人档案查询与更新、全局排行榜数据获取
/// </summary>
[ApiController]
[Route("api/player")]
[Authorize]
public class PlayerController : AppControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayerController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    /// <summary>
    /// 获取当前登录玩家的完整个人档案信息
    /// </summary>
    /// <returns>玩家档案 PlayerProfileOutput（含昵称、头像、等级、经验、金币、钻石等）</returns>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<PlayerProfileOutput>();
        }

        var profile = await _playerService.GetProfileAsync(playerId);
        if (profile == null)
        {
            return NotFoundFail<PlayerProfileOutput>("玩家不存在");
        }

        return Success(profile, "获取成功");
    }

    /// <summary>
    /// 更新当前玩家档案：修改玩家昵称、头像等个人展示信息
    /// </summary>
    /// <param name="input">玩家更新参数，包含新昵称和新头像</param>
    /// <returns>更新后的玩家档案 PlayerProfileOutput</returns>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdatePlayerInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<PlayerProfileOutput>();
        }

        var profile = await _playerService.UpdateProfileAsync(playerId, input);
        if (profile == null)
        {
            return NotFoundFail<PlayerProfileOutput>("玩家不存在");
        }

        return Success(profile, "更新成功");
    }

    /// <summary>
    /// 获取全局战力排行榜
    /// </summary>
    /// <param name="top">返回前 N 名玩家，默认 50，最大 100</param>
    /// <returns>排行榜玩家列表，包含排名、玩家昵称、战力等信息</returns>
    [HttpGet("leaderboard")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int top = 50)
    {
        var list = await _playerService.GetLeaderboardAsync(top);
        return Success(list, "获取成功");
    }
}
