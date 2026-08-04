namespace ShotsGame.Core.Entities;

/// <summary>
/// 签到记录
/// </summary>
public class CheckInRecord : BaseEntity
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
    /// 周标识键
    /// </summary>
    public string WeekKey { get; set; } = string.Empty;
    /// <summary>
    /// 签到日期列表（字符串形式）
    /// </summary>
    public string CheckInDays { get; set; } = string.Empty;
    /// <summary>
    /// 上次签到日期
    /// </summary>
    public DateTimeOffset? LastCheckInDate { get; set; }
    /// <summary>
    /// 连续签到天数
    /// </summary>
    public int ConsecutiveDays { get; set; } = 0;
}
