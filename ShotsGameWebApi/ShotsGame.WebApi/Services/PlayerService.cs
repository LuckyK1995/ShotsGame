using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Player;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 玩家服务：玩家档案查询、玩家档案（昵称/头像）更新、全服排行榜（按战斗力/等级/积分降序）查询、玩家统计上报
/// </summary>
public class PlayerService : IPlayerService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IMapper _mapper;
    private readonly IOnlinePresenceService _onlinePresenceService;

    public PlayerService(
        IPlayerRepository playerRepository,
        IMapper mapper,
        IOnlinePresenceService onlinePresenceService)
    {
        _playerRepository = playerRepository;
        _mapper = mapper;
        _onlinePresenceService = onlinePresenceService;
    }

    /// <summary>
    /// 获取玩家完整档案资料（等级、经验、金币、属性、昵称、头像、分数、PK统计等）
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
    /// 获取全服玩家排行榜（按指定字段降序取前 N 名，含在线状态、PK胜率、关卡信息）
    /// </summary>
    /// <param name="top">取前多少名（小于等于 0 或大于 100 默认为 50）</param>
    /// <param name="sortBy">排序字段：power=战斗力降序、level=等级降序、score=积分降序（默认 power）</param>
    /// <returns>排行榜条目列表（含排名、玩家ID、昵称、战斗力、PK胜率、在线状态等）</returns>
    public async Task<List<LeaderboardEntryOutput>> GetLeaderboardAsync(int top, string sortBy = "power")
    {
        // 限制最大条数，防止过大查询
        top = top is <= 0 or > 100 ? 50 : top;

        var players = await _playerRepository.GetLeaderboardAsync(top, sortBy);

        // 映射并补充排名、在线状态、PK胜率
        var list = _mapper.Map<List<LeaderboardEntryOutput>>(players);
        for (var i = 0; i < list.Count; i++)
        {
            var entry = list[i];
            entry.Rank = i + 1;
            entry.IsOnline = _onlinePresenceService.IsOnline(entry.PlayerId);
            entry.PkWinRate = CalcWinRate(entry.PkWins, entry.PkTotal);
        }

        return list;
    }

    /// <summary>
    /// 更新玩家统计信息（客户端上报战斗力、当前关卡最大关卡），仅更新非空字段
    /// </summary>
    /// <param name="playerId">玩家ID</param>
    /// <param name="input">更新参数（Power/MaxStage，可选）</param>
    /// <returns>更新后玩家档案输出，玩家不存在返回 null</returns>
    public async Task<PlayerProfileOutput?> UpdateStatsAsync(string playerId, UpdatePlayerStatsInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (input.Power.HasValue)
        {
            player.Power = input.Power.Value;
        }
        if (input.MaxStage.HasValue)
        {
            // 仅当上报的关卡大于当前最大关卡才更新
            if (input.MaxStage.Value > player.MaxStage)
            {
                player.MaxStage = input.MaxStage.Value;
            }
        }

        player.LastActiveAt = DateTimeOffset.UtcNow;
        await _playerRepository.UpdateAsync(player);

        return _mapper.Map<PlayerProfileOutput>(player);
    }

    /// <summary>
    /// 计算PK胜率（0-100），总场次为0返回0
    /// </summary>
    private static double CalcWinRate(int wins, int total)
    {
        if (total <= 0)
        {
            return 0;
        }
        return Math.Round(wins * 100.0 / total, 2);
    }
}
