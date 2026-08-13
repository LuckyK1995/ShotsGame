using ShotsGame.Core.DTOs.Pk;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// PK对战服务接口：负责查询在线玩家列表、上报PK结果
/// </summary>
public interface IPkService
{
    /// <summary>
    /// 获取在线玩家列表（排除自己），用于PK选择对手
    /// </summary>
    /// <param name="currentPlayerId">当前玩家ID（将被排除）</param>
    /// <returns>在线玩家出参列表</returns>
    Task<List<OnlinePlayerOutput>> GetOnlinePlayersAsync(string currentPlayerId);

    /// <summary>
    /// 上报PK结果：更新双方PK统计，创建对战记录
    /// </summary>
    /// <param name="challengerId">挑战方玩家ID</param>
    /// <param name="input">上报参数（应战方、胜负、时长）</param>
    /// <returns>对战记录出参；挑战方或应战方不存在返回 null</returns>
    Task<PkRecordOutput?> ReportResultAsync(string challengerId, ReportPkResultInput input);

    /// <summary>
    /// 获取指定玩家的真实战斗属性：优先从存档快照里的 statsSnapshot 读取，无存档时用 power+level 估算公式兜底
    /// </summary>
    /// <param name="playerId">目标玩家ID</param>
    /// <returns>战斗属性；玩家不存在返回 null</returns>
    Task<PlayerBattleStatsOutput?> GetPlayerBattleStatsAsync(string playerId);
}
