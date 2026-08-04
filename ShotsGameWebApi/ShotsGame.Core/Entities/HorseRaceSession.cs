namespace ShotsGame.Core.Entities;

/// <summary>
/// 赛马会话
/// </summary>
public class HorseRaceSession : BaseEntity
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
    /// 会话标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 赛马数据（JSON）
    /// </summary>
    public string HorsesJson { get; set; } = string.Empty;

    /// <summary>
    /// 回合数据（JSON）
    /// </summary>
    public string RoundsJson { get; set; } = string.Empty;

    /// <summary>
    /// 投注数据（JSON）
    /// </summary>
    public string? BetsJson { get; set; }

    /// <summary>
    /// 总投注金额
    /// </summary>
    public long TotalBet { get; set; } = 0;

    /// <summary>
    /// 会话状态
    /// </summary>
    public int Status { get; set; }

    /// <summary>
    /// 冠军马匹标识
    /// </summary>
    public int? ChampionHorseId { get; set; }

    /// <summary>
    /// 赢得金币数
    /// </summary>
    public long GoldWon { get; set; } = 0;
}
