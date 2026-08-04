namespace ShotsGame.Core.Entities;

/// <summary>
/// 答题记录
/// </summary>
public class QuizAttempt : BaseEntity
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
    /// 答题日期
    /// </summary>
    public string AttemptDate { get; set; } = string.Empty;

    /// <summary>
    /// 答对题数
    /// </summary>
    public int CorrectCount { get; set; }

    /// <summary>
    /// 总题数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 获得金币数
    /// </summary>
    public long GoldEarned { get; set; }

    /// <summary>
    /// 完成时间
    /// </summary>
    public DateTimeOffset CompletedAt { get; set; } = DateTimeOffset.UtcNow;
}
