using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Mail;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 邮件控制器：负责玩家邮件分页查询、单封详情、标记已读、领取附件、一键领取与删除邮件
/// </summary>
[ApiController]
[Route("api/mail")]
[Authorize]
public class MailController : AppControllerBase
{
    private readonly IMailService _mailService;

    public MailController(IMailService mailService)
    {
        _mailService = mailService;
    }

    /// <summary>
    /// 分页获取当前玩家的邮件列表
    /// </summary>
    /// <param name="page">页码，从 1 开始，默认 1</param>
    /// <param name="pageSize">每页邮件数量，默认 20</param>
    /// <returns>分页邮件列表 MailListOutput（含邮件摘要、已读/领取状态）</returns>
    [HttpGet]
    public async Task<IActionResult> GetMailsAsync([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<MailListOutput>();
        }

        var result = await _mailService.GetMailsAsync(playerId, page, pageSize);
        if (result == null)
        {
            return NotFoundFail<MailListOutput>("邮件列表不存在");
        }

        return Success(result, "获取邮件列表成功");
    }

    /// <summary>
    /// 获取单封邮件的完整内容与附件详情
    /// </summary>
    /// <param name="mailId">目标邮件唯一标识 ID</param>
    /// <returns>邮件详情 MailOutput（含正文、附件列表等）</returns>
    [HttpGet("{mailId}")]
    public async Task<IActionResult> GetMailAsync(string mailId)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<MailOutput>();
        }

        var mail = await _mailService.GetMailAsync(playerId, mailId);
        if (mail == null)
        {
            return NotFoundFail<MailOutput>("邮件不存在");
        }

        return Success(mail, "获取邮件成功");
    }

    /// <summary>
    /// 发送系统邮件给指定玩家（系统/管理员用接口）
    /// </summary>
    /// <param name="input">发送邮件参数，包含收件人 ID、主题、正文、附件</param>
    /// <returns>发送结果（成功或失败）</returns>
    [HttpPost("send")]
    public async Task<IActionResult> SendMailAsync(SendMailInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail();
        }

        var result = await _mailService.SendMailAsync(playerId, input);
        if (!result)
        {
            return Fail("发送邮件失败");
        }

        return Success("发送成功");
    }

    /// <summary>
    /// 将指定邮件标记为已读状态
    /// </summary>
    /// <param name="input">已读参数，包含目标邮件 ID 列表</param>
    /// <returns>标记已读结果（成功或失败）</returns>
    [HttpPost("read")]
    public async Task<IActionResult> MarkReadAsync(ReadMailInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail();
        }

        var result = await _mailService.MarkReadAsync(playerId, input);
        if (!result)
        {
            return Fail("标记已读失败");
        }

        return Success("标记已读成功");
    }

    /// <summary>
    /// 领取指定邮件中的物品附件奖励
    /// </summary>
    /// <param name="input">领取邮件参数，包含目标邮件 ID</param>
    /// <returns>领取结果 ClaimAllOutput（含获得的全部奖励物品）</returns>
    [HttpPost("claim")]
    public async Task<IActionResult> ClaimAttachmentsAsync(ClaimMailInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ClaimAllOutput>();
        }

        var result = await _mailService.ClaimAttachmentsAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<ClaimAllOutput>("领取失败");
        }

        return Success(result, "领取成功");
    }

    /// <summary>
    /// 一键领取所有可领取邮件的全部附件奖励
    /// </summary>
    /// <returns>领取结果 ClaimAllOutput（含获得的全部奖励物品汇总）</returns>
    [HttpPost("claim-all")]
    public async Task<IActionResult> ClaimAllAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ClaimAllOutput>();
        }

        var result = await _mailService.ClaimAllAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<ClaimAllOutput>("领取失败");
        }

        return Success(result, "一键领取成功");
    }

    /// <summary>
    /// 批量删除指定邮件列表
    /// </summary>
    /// <param name="input">删除参数，包含待删除邮件 ID 列表</param>
    /// <returns>删除结果（成功或失败）</returns>
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteMailsAsync(DeleteMailInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail();
        }

        var result = await _mailService.DeleteMailsAsync(playerId, input);
        if (!result)
        {
            return Fail("删除失败");
        }

        return Success("删除成功");
    }
}
