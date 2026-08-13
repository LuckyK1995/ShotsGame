using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Pk;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// PK对战控制器：负责查询在线玩家列表、上报PK结果
/// </summary>
[ApiController]
[Route("api/pk")]
[Authorize]
public class PkController : AppControllerBase
{
    private readonly IPkService _pkService;
    private readonly IOnlinePresenceService _onlinePresenceService;

    public PkController(IPkService pkService, IOnlinePresenceService onlinePresenceService)
    {
        _pkService = pkService;
        _onlinePresenceService = onlinePresenceService;
    }

    /// <summary>
    /// 获取在线玩家列表（排除当前玩家，用于PK选择对手）
    /// </summary>
    /// <returns>在线玩家出参列表</returns>
    [HttpGet("online-players")]
    public async Task<IActionResult> GetOnlinePlayers()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<List<OnlinePlayerOutput>>();
        }

        // 当前玩家标记在线（保证自己心跳活跃）
        _onlinePresenceService.MarkOnline(playerId);

        var list = await _pkService.GetOnlinePlayersAsync(playerId);
        return Success(list, "获取成功");
    }

    /// <summary>
    /// 上报PK结果：更新双方PK统计、创建对战记录
    /// </summary>
    /// <param name="input">上报参数（应战方ID、是否胜利、对战时长）</param>
    /// <returns>对战记录出参</returns>
    [HttpPost("report")]
    public async Task<IActionResult> Report([FromBody] ReportPkResultInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<PkRecordOutput>();
        }

        // 基础参数校验
        if (string.IsNullOrWhiteSpace(input.DefenderId))
        {
            return InvalidParamFail<PkRecordOutput>("应战方ID不能为空");
        }
        if (input.DefenderId == playerId)
        {
            return InvalidParamFail<PkRecordOutput>("不能与自己PK");
        }
        if (input.DurationSeconds < 0)
        {
            return InvalidParamFail<PkRecordOutput>("对战时长不能为负数");
        }

        var result = await _pkService.ReportResultAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<PkRecordOutput>("玩家不存在");
        }

        return Success(result, "上报成功");
    }

    /// <summary>
    /// 获取指定玩家的真实战斗属性（用于PK对战时取对手完整属性）
    /// 优先从玩家最新存档快照里的 statsSnapshot 读取；读不到时按 power+level 估算兜底。
    /// </summary>
    /// <param name="playerId">目标玩家ID</param>
    /// <returns>玩家战斗属性（含攻防暴抗 + 4 元素伤害/抗性）</returns>
    [HttpGet("player-stats/{playerId}")]
    public async Task<IActionResult> GetPlayerBattleStats([FromRoute] string playerId)
    {
        var self = GetCurrentUserId();
        if (string.IsNullOrEmpty(self))
        {
            return UnauthorizedFail<PlayerBattleStatsOutput>();
        }
        if (string.IsNullOrWhiteSpace(playerId))
        {
            return InvalidParamFail<PlayerBattleStatsOutput>("玩家ID不能为空");
        }

        var result = await _pkService.GetPlayerBattleStatsAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<PlayerBattleStatsOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }
}
