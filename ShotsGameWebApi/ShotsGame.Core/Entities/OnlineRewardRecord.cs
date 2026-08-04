namespace ShotsGame.Core.Entities;

/// <summary>
/// 在线奖励记录
/// </summary>
public class OnlineRewardRecord : BaseEntity
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
    /// 在线时长（分钟）
    /// </summary>
    public int OnlineMinutes { get; set; } = 0;
    /// <summary>
    /// 已领取等级
    /// </summary>
    public int ClaimedLevel { get; set; } = 0;
    /// <summary>
    /// 上次重置日期
    /// </summary>
    public DateTimeOffset LastResetDate { get; set; } = DateTimeOffset.UtcNow;
}
