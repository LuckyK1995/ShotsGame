using ShotsGame.Core.DTOs.Chat;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 聊天服务接口：负责发送聊天消息与查询频道历史消息
/// </summary>
public interface IChatService
{
    /// <summary>
    /// 发送聊天消息：校验内容长度，写入玩家昵称快照
    /// </summary>
    /// <param name="playerId">发送玩家ID</param>
    /// <param name="input">发送参数（频道、内容）</param>
    /// <returns>发送后的消息出参；玩家不存在或内容非法时返回 null</returns>
    Task<ChatMessageOutput?> SendMessageAsync(string playerId, SendChatInput input);

    /// <summary>
    /// 获取指定频道最近的消息（按 SentAt 升序返回，便于客户端直接展示）
    /// </summary>
    /// <param name="channel">频道标识</param>
    /// <param name="limit">最大条数（默认50，最大200）</param>
    /// <param name="beforeTick">分页游标：取此时间之前的消息（null 表示取最新）</param>
    /// <returns>消息出参列表（按发送时间升序）</returns>
    Task<List<ChatMessageOutput>> GetMessagesAsync(string channel, int limit, long? beforeTick);
}
