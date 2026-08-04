using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Battle;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 战斗系统服务：战斗结算提交（经验/金币/波次统计）、战斗奖励发放、玩家战斗历史分页查询
/// </summary>
public class BattleService : IBattleService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<BattleRecord> _battleRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public BattleService(
        IPlayerRepository playerRepository,
        IRepository<BattleRecord> battleRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _battleRepository = battleRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 提交战斗结算：写入战斗记录、发放金币和经验奖励、自动升级、更新玩家档案数据（击杀数/波次/分数统计）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">战斗结算参数（胜负、波次、击杀数、获得金币、经验、模式、难度等）</param>
    /// <returns>战斗结果输出（升级情况、获得奖励、新属性），玩家不存在返回 null</returns>
    public async Task<BattleResultOutput?> SubmitBattleAsync(string playerId, SubmitBattleInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        // ─── 奖励计算 ───
        // 金币：击杀数 * 5 + 波数 * 10，胜利翻倍
        var baseGold = input.Kills * 5L + input.Wave * 10L;
        var goldEarned = input.Result == BattleResult.Victory ? baseGold * 2 : baseGold;

        // 经验：波数 * 20 + 击杀数 * 8，胜利额外 +100
        var expEarned = input.Wave * 20L + input.Kills * 8L;
        if (input.Result == BattleResult.Victory)
        {
            expEarned += 100;
        }

        // ─── 写入战斗记录 ───
        var record = new BattleRecord
        {
            PlayerId = playerId,
            Mode = input.Mode,
            Result = input.Result,
            Wave = input.Wave,
            Score = input.Score,
            Kills = input.Kills,
            DurationSeconds = input.DurationSeconds,
            GoldEarned = goldEarned,
            ExpEarned = expEarned,
            PlayedAt = DateTimeOffset.UtcNow
        };
        await _battleRepository.AddAsync(record);

        // ─── 更新玩家档案 ───
        player.Gold += goldEarned;
        player.Exp += expEarned;
        player.Score += input.Score;
        player.TotalBattles += 1;
        player.TotalKills += input.Kills;
        if (input.Result == BattleResult.Victory)
        {
            player.TotalVictories += 1;
        }
        // 更新最高波数
        if (input.Wave > player.MaxWave)
        {
            player.MaxWave = input.Wave;
        }

        // ─── 升级处理：经验满则升级，提升升级所需经验上限 ───
        var oldLevel = player.Level;
        while (player.Exp >= player.ExpToNextLevel)
        {
            player.Exp -= player.ExpToNextLevel;
            player.Level += 1;
            // 每级升级所需经验递增 50%
            player.ExpToNextLevel = (long)(player.ExpToNextLevel * 1.5);
            // 每升一级赠送 1 技能点
            player.SkillPoints += 1;
        }
        var levelUp = player.Level > oldLevel;

        player.LastActiveAt = DateTimeOffset.UtcNow;
        await _playerRepository.UpdateAsync(player);

        return new BattleResultOutput
        {
            RecordId = record.Id,
            GoldEarned = goldEarned,
            ExpEarned = expEarned,
            NewLevel = player.Level,
            NewExp = player.Exp,
            NewExpToNextLevel = player.ExpToNextLevel,
            LevelUp = levelUp,
            NewMaxWave = player.MaxWave,
            NewScore = player.Score,
            NewGold = player.Gold
        };
    }

    /// <summary>
    /// 分页获取玩家战斗历史记录（按结束时间倒序排列）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="page">页码（从 1 开始）</param>
    /// <param name="pageSize">每页条数</param>
    /// <returns>分页战斗记录输出，玩家不存在返回空分页结果</returns>
    public async Task<PagedResult<BattleRecordOutput>> GetBattleHistoryAsync(string playerId, int page, int pageSize)
    {
        // 参数兜底
        page = page <= 0 ? 1 : page;
        pageSize = pageSize is <= 0 or > 100 ? 20 : pageSize;

        var query = _context.BattleRecords
            .Where(r => r.PlayerId == playerId && !r.IsDeleted)
            .OrderByDescending(r => r.PlayedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var outputs = _mapper.Map<List<BattleRecordOutput>>(items);
        return PagedResult<BattleRecordOutput>.Create(outputs, totalCount, page, pageSize);
    }
}
