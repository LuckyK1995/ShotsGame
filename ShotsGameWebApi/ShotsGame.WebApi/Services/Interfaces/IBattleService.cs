using ShotsGame.Core.DTOs.Battle;
using ShotsGame.Core.Models;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 战斗服务接口，负责战斗结算提交与战斗历史记录查询等业务
/// </summary>
public interface IBattleService
{
    /// <summary>
    /// 提交战斗结算数据，发放奖励并更新玩家档案（经验、金币、物品、装备等）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">战斗结算请求参数（包含战斗结果、击杀数、波次、时长等）</param>
    /// <returns>战斗结算结果与获得奖励详情，若失败则返回 null</returns>
    Task<BattleResultOutput?> SubmitBattleAsync(string playerId, SubmitBattleInput input);

    /// <summary>
    /// 分页获取玩家历史战斗记录列表
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="page">页码（从 1 开始）</param>
    /// <param name="pageSize">每页条数</param>
    /// <returns>分页战斗历史记录</returns>
    Task<PagedResult<BattleRecordOutput>> GetBattleHistoryAsync(string playerId, int page, int pageSize);
}
