using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Battle;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 战斗控制器：负责战斗结算提交、战斗历史记录查询等战斗相关业务
/// </summary>
[ApiController]
[Route("api/battle")]
[Authorize]
public class BattleController : AppControllerBase
{
    private readonly IBattleService _battleService;

    public BattleController(IBattleService battleService)
    {
        _battleService = battleService;
    }

    /// <summary>
    /// 提交战斗结算：上报战斗波次、击杀数、时长、得分等数据，计算奖励并落库
    /// </summary>
    /// <param name="input">战斗结算参数，包含波次、击杀数、持续时间、得分等</param>
    /// <returns>战斗结算结果 BattleResultOutput（含获得经验、金币、物品奖励等）</returns>
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitBattleInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<BattleResultOutput>();
        }

        // 基础参数校验
        if (input.Wave < 0 || input.Kills < 0 || input.DurationSeconds < 0 || input.Score < 0)
        {
            return InvalidParamFail<BattleResultOutput>("战斗数据不能为负数");
        }

        var result = await _battleService.SubmitBattleAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<BattleResultOutput>("玩家不存在");
        }

        return Success(result, "结算成功");
    }

    /// <summary>
    /// 分页获取当前玩家的战斗历史记录列表
    /// </summary>
    /// <param name="page">页码，从 1 开始，默认 1</param>
    /// <param name="pageSize">每页记录条数，默认 20</param>
    /// <returns>分页战斗历史记录 PagedResult&lt;BattleRecordOutput&gt;</returns>
    [HttpGet("history")]
    public async Task<IActionResult> History([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ShotsGame.Core.Models.PagedResult<BattleRecordOutput>>();
        }

        var result = await _battleService.GetBattleHistoryAsync(playerId, page, pageSize);
        return Success(result, "获取成功");
    }
}
