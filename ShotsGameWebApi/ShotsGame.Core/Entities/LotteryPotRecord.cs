namespace ShotsGame.Core.Entities;

/// <summary>
/// 抽奖罐记录
/// </summary>
public class LotteryPotRecord : BaseEntity
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
    /// 累计使用次数
    /// </summary>
    public int TotalUsed { get; set; } = 0;

    /// <summary>
    /// 上次使用时间
    /// </summary>
    public DateTimeOffset? LastUsedAt { get; set; }
}
