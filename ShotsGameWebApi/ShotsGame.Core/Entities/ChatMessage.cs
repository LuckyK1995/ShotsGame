namespace ShotsGame.Core.Entities;

/// <summary>
/// 聊天消息
/// </summary>
public class ChatMessage : BaseEntity
{
    /// <summary>频道标识（world=世界频道）</summary>
    public string Channel { get; set; } = "world";
    /// <summary>发送玩家ID</summary>
    public string PlayerId { get; set; } = string.Empty;
    /// <summary>关联玩家</summary>
    public Player Player { get; set; } = null!;
    /// <summary>发送者昵称快照（查询时免去join）</summary>
    public string DisplayName { get; set; } = string.Empty;
    /// <summary>消息内容</summary>
    public string Content { get; set; } = string.Empty;
    /// <summary>发送时间</summary>
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
}
