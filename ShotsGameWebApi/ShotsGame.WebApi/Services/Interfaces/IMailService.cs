using ShotsGame.Core.DTOs.Mail;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 邮件服务接口，负责邮件列表查询、单封查看、系统邮件发送、附件领取与邮件删除等业务
/// </summary>
public interface IMailService
{
    /// <summary>
    /// 分页获取玩家邮件列表
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="page">页码（从 1 开始）</param>
    /// <param name="pageSize">每页条数</param>
    /// <returns>分页邮件列表与总计数，若失败则返回 null</returns>
    Task<MailListOutput?> GetMailsAsync(string playerId, int page = 1, int pageSize = 20);

    /// <summary>
    /// 获取单封邮件详情及附件信息
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="mailId">邮件唯一标识</param>
    /// <returns>单封邮件详情，若不存在则返回 null</returns>
    Task<MailOutput?> GetMailAsync(string playerId, string mailId);

    /// <summary>
    /// 发送系统邮件给指定玩家
    /// </summary>
    /// <param name="playerId">接收玩家唯一标识</param>
    /// <param name="input">发送邮件请求参数（包含标题、正文、附件）</param>
    /// <returns>发送是否成功</returns>
    Task<bool> SendMailAsync(string playerId, SendMailInput input);

    /// <summary>
    /// 将指定邮件标记为已读
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">标记已读请求参数（包含邮件 ID 列表）</param>
    /// <returns>标记是否成功</returns>
    Task<bool> MarkReadAsync(string playerId, ReadMailInput input);

    /// <summary>
    /// 领取指定邮件的附件奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">领取附件请求参数（包含邮件 ID 列表）</param>
    /// <returns>附件领取结果与获得物品详情，若失败则返回 null</returns>
    Task<ClaimAllOutput?> ClaimAttachmentsAsync(string playerId, ClaimMailInput input);

    /// <summary>
    /// 一键领取所有未读邮件的附件奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>所有附件领取结果与获得物品汇总，若失败则返回 null</returns>
    Task<ClaimAllOutput?> ClaimAllAsync(string playerId);

    /// <summary>
    /// 删除指定邮件（仅删除邮件本身，已领附件不退还）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">删除邮件请求参数（包含邮件 ID 列表）</param>
    /// <returns>删除是否成功</returns>
    Task<bool> DeleteMailsAsync(string playerId, DeleteMailInput input);
}
