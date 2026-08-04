using ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Mail;

/// <summary>
/// 邮件出参
/// </summary>
public class MailOutput
{
    /// <summary>
    /// 邮件唯一ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 邮件类型（系统/玩家/奖励等）
    /// </summary>
    public MailType Type { get; set; }

    /// <summary>
    /// 邮件标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 邮件正文内容
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 邮件发送时间
    /// </summary>
    public DateTimeOffset SentAt { get; set; }

    /// <summary>
    /// 是否已读
    /// </summary>
    public bool IsRead { get; set; }

    /// <summary>
    /// 附件是否已领取
    /// </summary>
    public bool IsClaimed { get; set; }

    /// <summary>
    /// 附件数据（JSON 字符串格式）
    /// </summary>
    public string? AttachmentsJson { get; set; }

    /// <summary>
    /// 是否包含附件
    /// </summary>
    public bool HasAttachments { get; set; }
}

/// <summary>
/// 邮件列表出参
/// </summary>
public class MailListOutput
{
    /// <summary>
    /// 邮件列表
    /// </summary>
    public List<MailOutput> Items { get; set; } = new();

    /// <summary>
    /// 未读邮件数量
    /// </summary>
    public int UnreadCount { get; set; }

    /// <summary>
    /// 邮件总数量
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 当前页码（从1开始）
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 每页大小
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// 是否有下一页
    /// </summary>
    public bool HasNextPage { get; set; }
}

/// <summary>
/// 发送邮件入参
/// </summary>
public class SendMailInput
{
    /// <summary>
    /// 接收玩家ID
    /// </summary>
    public string PlayerId { get; set; } = string.Empty;

    /// <summary>
    /// 邮件类型
    /// </summary>
    public MailType Type { get; set; }

    /// <summary>
    /// 邮件标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 邮件正文内容
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 附件数据（JSON 字符串格式）
    /// </summary>
    public string? AttachmentsJson { get; set; }
}

/// <summary>
/// 标记已读入参
/// </summary>
public class ReadMailInput
{
    /// <summary>
    /// 要标记为已读的邮件ID数组
    /// </summary>
    public string[] MailIds { get; set; } = Array.Empty<string>();
}

/// <summary>
/// 领取附件入参
/// </summary>
public class ClaimMailInput
{
    /// <summary>
    /// 要领取附件的邮件ID数组
    /// </summary>
    public string[] MailIds { get; set; } = Array.Empty<string>();
}

/// <summary>
/// 一键领取出参
/// </summary>
public class ClaimAllOutput
{
    /// <summary>
    /// 累计领取金币总数
    /// </summary>
    public long TotalGold { get; set; }

    /// <summary>
    /// 成功领取邮件数
    /// </summary>
    public int ClaimedCount { get; set; }

    /// <summary>
    /// 领取失败邮件数
    /// </summary>
    public int FailedCount { get; set; }

    /// <summary>
    /// 各邮件领取结果消息列表
    /// </summary>
    public List<string> Messages { get; set; } = new();
}

/// <summary>
/// 删除邮件入参
/// </summary>
public class DeleteMailInput
{
    /// <summary>
    /// 要删除的邮件ID数组
    /// </summary>
    public string[] MailIds { get; set; } = Array.Empty<string>();
}
