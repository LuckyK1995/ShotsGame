using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Achievement;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 成就控制器：负责成就列表查询、成就奖励领取与成就进度手动更新
/// </summary>
[ApiController]
[Route("api/achievement")]
[Authorize]
public class AchievementController : AppControllerBase
{
    private readonly IAchievementService _achievementService;

    public AchievementController(IAchievementService achievementService)
    {
        _achievementService = achievementService;
    }

    /// <summary>
    /// 获取当前玩家全部成就列表及完成进度
    /// </summary>
    /// <returns>成就列表 AchievementListOutput（含各成就完成状态、进度、奖励信息）</returns>
    [HttpGet("list")]
    public async Task<IActionResult> GetAchievementsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<AchievementListOutput>();
        }

        var list = await _achievementService.GetAchievementsAsync(playerId);
        if (list == null)
        {
            return NotFoundFail<AchievementListOutput>("成就列表不存在");
        }

        return Success(list, "获取成就列表成功");
    }

    /// <summary>
    /// 领取已达成成就的奖励物品
    /// </summary>
    /// <param name="input">领取成就参数，包含目标成就 ID</param>
    /// <returns>领取结果 ClaimAchievementOutput（含获得的奖励物品）</returns>
    [HttpPost("claim")]
    public async Task<IActionResult> ClaimAchievementAsync(ClaimAchievementInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ClaimAchievementOutput>();
        }

        var result = await _achievementService.ClaimAchievementAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<ClaimAchievementOutput>("成就不存在或领取失败");
        }

        return Success(result, "领取成功");
    }

    /// <summary>
    /// 手动增加指定成就的完成进度（开发调试用接口）
    /// </summary>
    /// <param name="achievementId">目标成就 ID</param>
    /// <param name="increment">进度增量值（正整数）</param>
    /// <returns>更新进度结果（成功或失败）</returns>
    [HttpPost("update-progress")]
    public async Task<IActionResult> UpdateProgressAsync([FromQuery] string achievementId, [FromQuery] int increment)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail();
        }

        var result = await _achievementService.UpdateProgressAsync(playerId, achievementId, increment);
        if (!result)
        {
            return Fail("更新进度失败");
        }

        return Success("更新进度成功");
    }
}
