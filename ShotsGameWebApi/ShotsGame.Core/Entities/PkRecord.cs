namespace ShotsGame.Core.Entities;

/// <summary>
/// PK对战记录
/// </summary>
public class PkRecord : BaseEntity
{
    /// <summary>挑战方玩家ID</summary>
    public string ChallengerId { get; set; } = string.Empty;
    /// <summary>挑战方玩家</summary>
    public Player Challenger { get; set; } = null!;
    /// <summary>应战方玩家ID</summary>
    public string DefenderId { get; set; } = string.Empty;
    /// <summary>应战方玩家</summary>
    public Player Defender { get; set; } = null!;
    /// <summary>胜方玩家ID（平局为null）</summary>
    public string? WinnerId { get; set; }
    /// <summary>对战时间</summary>
    public DateTimeOffset PlayedAt { get; set; } = DateTimeOffset.UtcNow;
    /// <summary>对战时长（秒）</summary>
    public int DurationSeconds { get; set; }
}
