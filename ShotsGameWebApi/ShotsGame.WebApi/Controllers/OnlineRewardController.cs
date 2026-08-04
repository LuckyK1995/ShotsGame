using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.OnlineReward;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 在线奖励控制器：负责玩家在线时长奖励状态查询与按档位领取在线奖励
/// </summary>
[ApiController]
[Route("api/online-reward")]
[Authorize]
public class OnlineRewardController : AppControllerBase
{
    private readonly IOnlineRewardService _onlineRewardService;

    public OnlineRewardController(IOnlineRewardService onlineRewardService)
    {
        _onlineRewardService = onlineRewardService;
    }

    /// <summary>
    /// 获取当前玩家在线时长奖励进度与各档位可领取状态
    /// </summary>
    /// <param name="minutes">累计在线分钟数（用于服务端校准），默认 0</param>
    /// <returns>在线奖励状态 OnlineRewardOutput（含已累计时长、各档位领取状态）</returns>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatusAsync([FromQuery] int minutes = 0)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<OnlineRewardOutput>();
        }

        if (minutes < 0)
        {
            return InvalidParamFail<OnlineRewardOutput>("在线分钟数不能为负数");
        }

        var result = await _onlineRewardService.GetStatusAsync(playerId, minutes);
        if (result == null)
        {
            return NotFoundFail<OnlineRewardOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 领取指定档位的在线时长奖励
    /// </summary>
    /// <param name="tier">奖励档位，取值 1-4（对应不同在线时长门槛）</param>
    /// <returns>领取结果 ClaimOnlineRewardOutput（含获得的奖励物品）</returns>
    [HttpPost("claim/{tier:int}")]
    public async Task<IActionResult> ClaimRewardAsync(int tier)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ClaimOnlineRewardOutput>();
        }

        if (tier < 1 || tier > 4)
        {
            return InvalidParamFail<ClaimOnlineRewardOutput>("档位必须在 1-4 之间");
        }

        var result = await _onlineRewardService.ClaimRewardAsync(playerId, tier);
        if (result == null)
        {
            return NotFoundFail<ClaimOnlineRewardOutput>("奖励不可领取或玩家不存在");
        }

        return Success(result, "领取成功");
    }
}
