namespace ShotsGame.Core.DTOs.Chat;

/// <summary>发送聊天消息入参</summary>
public class SendChatInput
{
    /// <summary>频道（默认world）</summary>
    public string Channel { get; set; } = "world";
    /// <summary>消息内容（1-200字符）</summary>
    public string Content { get; set; } = string.Empty;
}

/// <summary>聊天消息出参</summary>
public class ChatMessageOutput
{
    /// <summary>消息唯一ID</summary>
    public string Id { get; set; } = string.Empty;
    /// <summary>频道</summary>
    public string Channel { get; set; } = string.Empty;
    /// <summary>发送玩家ID</summary>
    public string PlayerId { get; set; } = string.Empty;
    /// <summary>发送者昵称</summary>
    public string DisplayName { get; set; } = string.Empty;
    /// <summary>消息内容</summary>
    public string Content { get; set; } = string.Empty;
    /// <summary>发送时间</summary>
    public DateTimeOffset SentAt { get; set; }
}
