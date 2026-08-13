using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Calculate;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 计算控制器：负责玩家综合战斗属性计算、经验升级进度计算与战斗金币收益计算
/// </summary>
[ApiController]
[Route("api/calculate")]
[Authorize]
public class CalculateController : AppControllerBase
{
    private readonly ICalculateService _calculateService;

    public CalculateController(ICalculateService calculateService)
    {
        _calculateService = calculateService;
    }

    /// <summary>
    /// 计算玩家完整战斗属性（含装备、技能、天赋等全部加成汇总）
    /// </summary>
    /// <returns>玩家完整属性面板 PlayerStatsOutput</returns>
    [HttpGet("player-stats")]
    public async Task<IActionResult> CalculatePlayerStatsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<PlayerStatsOutput>();
        }

        var result = await _calculateService.CalculatePlayerStatsAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<PlayerStatsOutput>("玩家不存在");
        }

        return Success(result, "计算成功");
    }

    /// <summary>
    /// 计算玩家当前等级经验进度与升级所需经验
    /// </summary>
    /// <returns>经验进度信息 ExpCalculationOutput（含当前经验、升级所需经验、经验百分比）</returns>
    [HttpGet("exp-progress")]
    public async Task<IActionResult> CalculateExpAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ExpCalculationOutput>();
        }

        var result = await _calculateService.CalculateExpAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<ExpCalculationOutput>("玩家不存在");
        }

        return Success(result, "计算成功");
    }

    /// <summary>
    /// 根据战斗参数和玩家加成计算最终金币收益
    /// </summary>
    /// <param name="input">金币计算参数，包含基础金币和加成倍率相关信息</param>
    /// <returns>金币计算结果 GoldCalculationOutput（含最终金币数量及各加成明细）</returns>
    [HttpPost("gold")]
    public async Task<IActionResult> CalculateGoldAsync([FromBody] GoldCalculationInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<GoldCalculationOutput>();
        }

        if (input.BaseGold < 0)
        {
            return InvalidParamFail<GoldCalculationOutput>("基础金币不能为负数");
        }

        var result = await _calculateService.CalculateGoldAsync(input);
        if (result == null)
        {
            return Fail<GoldCalculationOutput>("计算失败");
        }

        return Success(result, "计算成功");
    }
}
