using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Chat;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 聊天服务实现：负责发送聊天消息、查询频道历史消息
/// </summary>
public class ChatService : IChatService
{
    /// <summary>消息内容最大长度</summary>
    private const int MaxContentLength = 200;
    /// <summary>默认查询条数</summary>
    private const int DefaultLimit = 50;
    /// <summary>最大查询条数</summary>
    private const int MaxLimit = 200;

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<ChatMessage> _chatRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public ChatService(
        IPlayerRepository playerRepository,
        IRepository<ChatMessage> chatRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _chatRepository = chatRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 发送聊天消息：校验内容长度（1-200），查询玩家昵称存入 DisplayName 快照
    /// </summary>
    /// <param name="playerId">发送玩家ID</param>
    /// <param name="input">发送参数</param>
    /// <returns>消息出参；玩家不存在或内容非法返回 null</returns>
    public async Task<ChatMessageOutput?> SendMessageAsync(string playerId, SendChatInput input)
    {
        // 内容校验
        var content = input.Content?.Trim() ?? string.Empty;
        if (content.Length is < 1 or > MaxContentLength)
        {
            return null;
        }

        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var channel = string.IsNullOrWhiteSpace(input.Channel) ? "world" : input.Channel.Trim();
        var message = new ChatMessage
        {
            Channel = channel,
            PlayerId = playerId,
            DisplayName = player.DisplayName,
            Content = content,
            SentAt = DateTimeOffset.UtcNow
        };
        await _chatRepository.AddAsync(message);

        return _mapper.Map<ChatMessageOutput>(message);
    }

    /// <summary>
    /// 获取指定频道最近的消息：按 SentAt 降序取最近 limit 条，返回时按 SentAt 升序
    /// </summary>
    /// <param name="channel">频道</param>
    /// <param name="limit">最大条数</param>
    /// <param name="beforeTick">分页游标（取此时间之前的消息，null 取最新）</param>
    /// <returns>消息出参列表（按发送时间升序）</returns>
    public async Task<List<ChatMessageOutput>> GetMessagesAsync(string channel, int limit, long? beforeTick)
    {
        // 限制条数
        limit = limit is <= 0 or > MaxLimit ? DefaultLimit : limit;
        channel = string.IsNullOrWhiteSpace(channel) ? "world" : channel;

        var query = _context.ChatMessages
            .Where(m => m.Channel == channel && !m.IsDeleted);

        if (beforeTick.HasValue)
        {
            var before = DateTimeOffset.FromUnixTimeMilliseconds(beforeTick.Value);
            query = query.Where(m => m.SentAt < before);
        }

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(limit)
            .ToListAsync();

        // 映射后按时间升序返回
        var outputs = _mapper.Map<List<ChatMessageOutput>>(messages);
        outputs.Sort((a, b) => a.SentAt.CompareTo(b.SentAt));
        return outputs;
    }
}
