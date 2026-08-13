using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Chat;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 聊天控制器：负责频道消息获取与发送
/// </summary>
[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : AppControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// 获取指定频道的最近聊天消息（按发送时间升序返回）
    /// </summary>
    /// <param name="channel">频道标识，默认 world</param>
    /// <param name="limit">最大条数，默认 50，最大 200</param>
    /// <param name="beforeTick">分页游标：取此 Unix 毫秒时间之前的消息，留空取最新</param>
    /// <returns>聊天消息列表</returns>
    [HttpGet("messages")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMessages(
        [FromQuery] string channel = "world",
        [FromQuery] int limit = 50,
        [FromQuery] long? beforeTick = null)
    {
        var list = await _chatService.GetMessagesAsync(channel, limit, beforeTick);
        return Success(list, "获取成功");
    }

    /// <summary>
    /// 发送聊天消息：校验内容长度（1-200），写入玩家昵称快照
    /// </summary>
    /// <param name="input">发送参数（频道、内容）</param>
    /// <returns>发送后的消息</returns>
    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendChatInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ChatMessageOutput>();
        }

        // 基础参数校验
        var content = input.Content?.Trim() ?? string.Empty;
        if (content.Length is < 1 or > 200)
        {
            return InvalidParamFail<ChatMessageOutput>("消息内容长度需在1-200之间");
        }

        var result = await _chatService.SendMessageAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<ChatMessageOutput>("玩家不存在");
        }

        return Success(result, "发送成功");
    }
}
