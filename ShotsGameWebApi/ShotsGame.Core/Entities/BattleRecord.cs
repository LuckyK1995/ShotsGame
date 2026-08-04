using ShotsGame.Core.Enums;

namespace ShotsGame.Core.Entities;

/// <summary>
/// 战斗记录（每场战斗结算）
/// </summary>
public class BattleRecord : BaseEntity
{
    /// <summary>
    /// 玩家标识
    /// </summary>
    public string PlayerId { get; set; } = string.Empty;
    /// <summary>
    /// 关联玩家
    /// </summary>
    public Player Player { get; set; } = null!;

    /// <summary>
    /// 游戏模式
    /// </summary>
    public GameMode Mode { get; set; }
    /// <summary>
    /// 战斗结果
    /// </summary>
    public BattleResult Result { get; set; }
    /// <summary>
    /// 到达波次
    /// </summary>
    public int Wave { get; set; }
    /// <summary>
    /// 获得积分
    /// </summary>
    public long Score { get; set; }
    /// <summary>
    /// 击杀数
    /// </summary>
    public int Kills { get; set; }
    /// <summary>
    /// 战斗时长（秒）
    /// </summary>
    public int DurationSeconds { get; set; }

    /// <summary>
    /// 获得金币数
    /// </summary>
    public long GoldEarned { get; set; }
    /// <summary>
    /// 获得经验值
    /// </summary>
    public long ExpEarned { get; set; }

    /// <summary>
    /// 战斗时间
    /// </summary>
    public DateTimeOffset PlayedAt { get; set; } = DateTimeOffset.UtcNow;
}
