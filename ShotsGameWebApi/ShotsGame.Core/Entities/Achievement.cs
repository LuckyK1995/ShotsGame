namespace ShotsGame.Core.Entities;

/// <summary>
/// 玩家成就进度
/// </summary>
public class Achievement : BaseEntity
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
    /// 成就标识
    /// </summary>
    public string AchievementId { get; set; } = string.Empty;
    /// <summary>
    /// 是否已解锁
    /// </summary>
    public bool Unlocked { get; set; } = false;
    /// <summary>
    /// 是否已领取奖励
    /// </summary>
    public bool Claimed { get; set; } = false;
    /// <summary>
    /// 当前进度值
    /// </summary>
    public int Progress { get; set; } = 0;
    /// <summary>
    /// 解锁时间
    /// </summary>
    public DateTimeOffset? UnlockedAt { get; set; }
}
