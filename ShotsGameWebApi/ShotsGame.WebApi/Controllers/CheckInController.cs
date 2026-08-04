using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.CheckIn;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 签到控制器：负责每日签到状态查询、本周签到奖励预览与执行签到领奖
/// </summary>
[ApiController]
[Route("api/checkin")]
[Authorize]
public class CheckInController : AppControllerBase
{
    private readonly ICheckInService _checkInService;

    public CheckInController(ICheckInService checkInService)
    {
        _checkInService = checkInService;
    }

    /// <summary>
    /// 获取当前玩家本周签到进度与今日签到状态
    /// </summary>
    /// <returns>签到状态信息 CheckInOutput（含已签到天数、今日是否可签）</returns>
    [HttpGet("status")]
    public async Task<IActionResult> GetCheckInStatusAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<CheckInOutput>();
        }

        var status = await _checkInService.GetCheckInStatusAsync(playerId);
        if (status == null)
        {
            return NotFoundFail<CheckInOutput>("签到状态不存在");
        }

        return Success(status, "获取签到状态成功");
    }

    /// <summary>
    /// 获取本周每日签到对应的奖励配置表
    /// </summary>
    /// <returns>本周奖励列表 WeekRewardsOutput（每天对应的奖励物品及领取状态）</returns>
    [HttpGet("week-rewards")]
    public async Task<IActionResult> GetWeekRewardsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<WeekRewardsOutput>();
        }

        var rewards = await _checkInService.GetWeekRewardsAsync(playerId);
        if (rewards == null)
        {
            return NotFoundFail<WeekRewardsOutput>("本周奖励不存在");
        }

        return Success(rewards, "获取本周奖励成功");
    }

    /// <summary>
    /// 执行今日签到并领取对应签到奖励
    /// </summary>
    /// <returns>签到结果 DoCheckInOutput（含获得的签到奖励）</returns>
    [HttpPost("check")]
    public async Task<IActionResult> DoCheckInAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<DoCheckInOutput>();
        }

        var result = await _checkInService.DoCheckInAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<DoCheckInOutput>("签到失败");
        }

        return Success(result, "签到成功");
    }
}
