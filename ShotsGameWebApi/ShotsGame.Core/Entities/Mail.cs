using ShotsGame.Core.Enums;

namespace ShotsGame.Core.Entities;

/// <summary>
/// 游戏内邮件
/// </summary>
public class Mail : BaseEntity
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
    /// 邮件类型
    /// </summary>
    public MailType Type { get; set; }
    /// <summary>
    /// 邮件标题
    /// </summary>
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 邮件正文
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 是否已读
    /// </summary>
    public bool IsRead { get; set; } = false;
    /// <summary>
    /// 是否已领取附件
    /// </summary>
    public bool IsClaimed { get; set; } = false;

    /// <summary>
    /// 附件（JSON）
    /// </summary>
    public string? AttachmentsJson { get; set; }

    /// <summary>
    /// 发送时间
    /// </summary>
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
}
