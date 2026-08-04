using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Achievement;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 成就系统服务：玩家成就列表查询、成就奖励领取、击杀/战斗/等级等成就进度自动更新
/// </summary>
public class AchievementService : IAchievementService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<Achievement> _achievementRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public AchievementService(
        IPlayerRepository playerRepository,
        IRepository<Achievement> achievementRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _achievementRepository = achievementRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>系统成就配置表（11个）</summary>
    private static readonly List<(string Id, string Name, string Desc, int Target, long RewardGold)> SystemAchievementConfigs = new()
    {
        ("sys_first_blood", "首杀", "完成第一次击杀", 1, 100),
        ("sys_killer_100", "百人斩", "累计击杀100个敌人", 100, 500),
        ("sys_killer_1000", "千人斩", "累计击杀1000个敌人", 1000, 5000),
        ("sys_battle_10", "初出茅庐", "完成10场战斗", 10, 200),
        ("sys_battle_100", "身经百战", "完成100场战斗", 100, 2000),
        ("sys_victory_10", "十连胜", "累计胜利10场", 10, 300),
        ("sys_victory_50", "常胜将军", "累计胜利50场", 50, 3000),
        ("sys_wave_10", "突破十波", "单局最高波数达到10", 10, 400),
        ("sys_wave_50", "半百之墙", "单局最高波数达到50", 50, 4000),
        ("sys_wave_100", "百波王者", "单局最高波数达到100", 100, 10000),
        ("sys_score_100k", "百万分先生", "累计分数达到100000", 100000, 8000)
    };

    /// <summary>等级成就配置表（20个）</summary>
    private static readonly List<(string Id, string Name, string Desc, int Target, int RewardSkillPoint)> LevelAchievementConfigs = new()
    {
        ("lvl_2", "初入江湖", "达到等级2", 2, 1),
        ("lvl_5", "小有所成", "达到等级5", 5, 2),
        ("lvl_10", "融会贯通", "达到等级10", 10, 3),
        ("lvl_15", "炉火纯青", "达到等级15", 15, 4),
        ("lvl_20", "登峰造极", "达到等级20", 20, 5),
        ("lvl_25", "出神入化", "达到等级25", 25, 6),
        ("lvl_30", "一代宗师", "达到等级30", 30, 8),
        ("lvl_35", "绝世高手", "达到等级35", 35, 10),
        ("lvl_40", "武林盟主", "达到等级40", 40, 12),
        ("lvl_45", "笑傲江湖", "达到等级45", 45, 15),
        ("lvl_50", "独孤求败", "达到等级50", 50, 20),
        ("lvl_55", "超凡入圣", "达到等级55", 55, 25),
        ("lvl_60", "返璞归真", "达到等级60", 60, 30),
        ("lvl_65", "天人合一", "达到等级65", 65, 35),
        ("lvl_70", "破碎虚空", "达到等级70", 70, 40),
        ("lvl_75", "武破虚空", "达到等级75", 75, 50),
        ("lvl_80", "羽化登仙", "达到等级80", 80, 60),
        ("lvl_85", "诸神之战", "达到等级85", 85, 75),
        ("lvl_90", "众神之巅", "达到等级90", 90, 90),
        ("lvl_100", "至高无上", "达到等级100", 100, 150)
    };

    /// <summary>
    /// 获取玩家成就列表（系统成就与等级成就两大分类），返回成就进度、完成状态与奖励领取状态
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>成就列表输出（分类统计、完成数量、总奖励概览），玩家不存在返回 null</returns>
    public async Task<AchievementListOutput?> GetAchievementsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var playerAchievements = await _context.Achievements
            .Where(a => a.PlayerId == playerId && !a.IsDeleted)
            .ToDictionaryAsync(a => a.AchievementId);

        var output = new AchievementListOutput();

        foreach (var cfg in SystemAchievementConfigs)
        {
            playerAchievements.TryGetValue(cfg.Id, out var pa);
            var entry = new AchievementOutput
            {
                AchievementId = cfg.Id,
                Name = cfg.Name,
                Description = cfg.Desc,
                Category = AchievementCategory.System,
                Target = cfg.Target,
                Progress = pa?.Progress ?? 0,
                Unlocked = pa?.Unlocked ?? false,
                Claimed = pa?.Claimed ?? false,
                RewardType = "Gold",
                RewardValue = cfg.RewardGold,
                UnlockedAt = pa?.UnlockedAt
            };
            output.SystemAchievements.Add(entry);
            if (entry.Unlocked) output.TotalUnlocked++;
            if (entry.Claimed) output.TotalClaimedRewardGold += cfg.RewardGold;
        }

        foreach (var cfg in LevelAchievementConfigs)
        {
            playerAchievements.TryGetValue(cfg.Id, out var pa);
            var entry = new AchievementOutput
            {
                AchievementId = cfg.Id,
                Name = cfg.Name,
                Description = cfg.Desc,
                Category = AchievementCategory.Level,
                Target = cfg.Target,
                Progress = pa?.Progress ?? player.Level,
                Unlocked = (pa?.Unlocked ?? false) || player.Level >= cfg.Target,
                Claimed = pa?.Claimed ?? false,
                RewardType = "SkillPoint",
                RewardValue = cfg.RewardSkillPoint,
                UnlockedAt = pa?.UnlockedAt
            };
            output.LevelAchievements.Add(entry);
            if (entry.Unlocked) output.TotalUnlocked++;
            if (entry.Claimed) output.TotalClaimedRewardPoints += cfg.RewardSkillPoint;
        }

        output.TotalCount = SystemAchievementConfigs.Count + LevelAchievementConfigs.Count;
        return output;
    }

    /// <summary>
    /// 领取成就奖励：校验成就完成度与领取状态，发放金币或技能点奖励并标记已领取
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">领取参数（成就 ID）</param>
    /// <returns>领取结果输出（成功/失败、奖励内容、消息），玩家不存在或未达成或已领取返回 null</returns>
    public async Task<ClaimAchievementOutput?> ClaimAchievementAsync(string playerId, ClaimAchievementInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var achievement = await _context.Achievements
            .FirstOrDefaultAsync(a => a.PlayerId == playerId && a.AchievementId == input.AchievementId && !a.IsDeleted);

        if (achievement == null)
        {
            var sysCfg = SystemAchievementConfigs.FirstOrDefault(c => c.Id == input.AchievementId);
            var lvlCfg = LevelAchievementConfigs.FirstOrDefault(c => c.Id == input.AchievementId);

            if (lvlCfg.Id != null && player.Level >= lvlCfg.Target)
            {
                achievement = new Achievement
                {
                    PlayerId = playerId,
                    AchievementId = lvlCfg.Id,
                    Progress = player.Level,
                    Unlocked = true,
                    Claimed = false,
                    UnlockedAt = DateTimeOffset.UtcNow
                };
                await _achievementRepository.AddAsync(achievement);
            }
            else
            {
                return new ClaimAchievementOutput { Success = false, Message = "成就未解锁或不存在" };
            }
        }

        if (!achievement.Unlocked)
        {
            return new ClaimAchievementOutput { Success = false, Message = "成就尚未解锁" };
        }

        if (achievement.Claimed)
        {
            return new ClaimAchievementOutput { Success = false, Message = "奖励已领取" };
        }

        long goldReward = 0;
        int spReward = 0;

        var sys = SystemAchievementConfigs.FirstOrDefault(c => c.Id == input.AchievementId);
        if (sys.Id != null)
        {
            goldReward = sys.RewardGold;
            player.Gold += goldReward;
        }

        var lvl = LevelAchievementConfigs.FirstOrDefault(c => c.Id == input.AchievementId);
        if (lvl.Id != null)
        {
            spReward = lvl.RewardSkillPoint;
            player.SkillPoints += spReward;
        }

        achievement.Claimed = true;
        await _achievementRepository.UpdateAsync(achievement);
        await _playerRepository.UpdateAsync(player);

        return new ClaimAchievementOutput
        {
            Success = true,
            Gold = goldReward,
            SkillPoints = spReward,
            Message = "奖励领取成功"
        };
    }

    /// <summary>
    /// 更新玩家指定成就的进度值（击杀数、战斗次数、波数等增量更新），达到目标值自动标记为已完成
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="achievementId">成就 ID</param>
    /// <param name="increment">进度增量值</param>
    /// <returns>更新成功返回 true，玩家不存在或成就 ID 无效返回 false</returns>
    public async Task<bool> UpdateProgressAsync(string playerId, string achievementId, int increment)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return false;
        }

        var cfg = SystemAchievementConfigs.FirstOrDefault(c => c.Id == achievementId);
        if (cfg.Id == null)
        {
            return false;
        }

        var achievement = await _context.Achievements
            .FirstOrDefaultAsync(a => a.PlayerId == playerId && a.AchievementId == achievementId && !a.IsDeleted);

        if (achievement == null)
        {
            achievement = new Achievement
            {
                PlayerId = playerId,
                AchievementId = achievementId,
                Progress = 0,
                Unlocked = false,
                Claimed = false
            };
            await _achievementRepository.AddAsync(achievement);
        }

        if (achievement.Unlocked)
        {
            return true;
        }

        achievement.Progress = Math.Min(achievement.Progress + increment, cfg.Target);

        if (achievement.Progress >= cfg.Target && !achievement.Unlocked)
        {
            achievement.Unlocked = true;
            achievement.UnlockedAt = DateTimeOffset.UtcNow;
        }

        await _achievementRepository.UpdateAsync(achievement);
        return true;
    }
}
