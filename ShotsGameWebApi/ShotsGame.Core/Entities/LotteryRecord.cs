namespace ShotsGame.Core.Entities;

/// <summary>
/// 水果机记录
/// </summary>
public class LotteryRecord : BaseEntity
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
    /// 抽奖币数量
    /// </summary>
    public int LotteryCoins { get; set; } = 0;

    /// <summary>
    /// 发放金币日期
    /// </summary>
    public string CoinsGivenDate { get; set; } = string.Empty;

    /// <summary>
    /// 投注数据（JSON）
    /// </summary>
    public string? BetsJson { get; set; }

    /// <summary>
    /// 连续登录天数
    /// </summary>
    public int ConsecutiveLoginDays { get; set; } = 0;

    /// <summary>
    /// 上次登录日期
    /// </summary>
    public string? LastLoginDate { get; set; }

    /// <summary>
    /// 锦标赛最佳成绩
    /// </summary>
    public int TournamentBest { get; set; } = 0;

    /// <summary>
    /// 上次赢取金额
    /// </summary>
    public int LastWinAmount { get; set; } = 0;

    /// <summary>
    /// 历史记录（JSON）
    /// </summary>
    public string? HistoryJson { get; set; }

    /// <summary>
    /// 免费旋转次数
    /// </summary>
    public int FreeSpins { get; set; } = 0;

    /// <summary>
    /// 幸运未中计数器
    /// </summary>
    public int LuckyMissCounter { get; set; } = 0;
}
