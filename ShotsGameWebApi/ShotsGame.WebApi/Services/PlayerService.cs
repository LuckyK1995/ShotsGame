using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Player;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 玩家服务：玩家档案查询、玩家档案（昵称/头像）更新、全服排行榜（按分数降序）查询
/// </summary>
public class PlayerService : IPlayerService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IMapper _mapper;

    public PlayerService(IPlayerRepository playerRepository, IMapper mapper)
    {
        _playerRepository = playerRepository;
        _mapper = mapper;
    }

    /// <summary>
    /// 获取玩家完整档案资料（等级、经验、金币、属性、昵称、头像、分数、统计等）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>玩家档案输出，玩家不存在返回 null</returns>
    public async Task<PlayerProfileOutput?> GetProfileAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        return _mapper.Map<PlayerProfileOutput>(player);
    }

    /// <summary>
    /// 更新玩家档案：修改玩家昵称或头像（非空字段才会更新）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">更新参数（昵称、头像，可选字段）</param>
    /// <returns>更新后玩家档案输出，玩家不存在返回 null</returns>
    public async Task<PlayerProfileOutput?> UpdateProfileAsync(string playerId, UpdatePlayerInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        // 仅更新传入的字段
        if (!string.IsNullOrWhiteSpace(input.DisplayName))
        {
            player.DisplayName = input.DisplayName;
        }
        if (input.AvatarUrl is not null)
        {
            player.AvatarUrl = input.AvatarUrl;
        }

        player.LastActiveAt = DateTimeOffset.UtcNow;
        await _playerRepository.UpdateAsync(player);

        return _mapper.Map<PlayerProfileOutput>(player);
    }

    /// <summary>
    /// 获取全服玩家排行榜（按总分降序取前 N 名）
    /// </summary>
    /// <param name="top">取前多少名（小于等于 0 默认为 100，大于 500 限制为 500）</param>
    /// <returns>排行榜条目列表（玩家 ID、昵称、分数、等级等）</returns>
    public async Task<List<LeaderboardEntryOutput>> GetLeaderboardAsync(int top)
    {
        // 限制最大条数，防止过大查询
        top = top is <= 0 or > 100 ? 50 : top;

        var players = await _playerRepository.GetLeaderboardAsync(top);

        // 映射并补充排名
        var list = _mapper.Map<List<LeaderboardEntryOutput>>(players);
        for (var i = 0; i < list.Count; i++)
        {
            list[i].Rank = i + 1;
        }

        return list;
    }
}
