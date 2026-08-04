using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Skill;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 技能树服务：属性技能与战斗技能树查询、技能升级消耗技能点、技能降级返还技能点
/// </summary>
public class SkillService : ISkillService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<PlayerSkill> _playerSkillRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public SkillService(
        IPlayerRepository playerRepository,
        IRepository<PlayerSkill> playerSkillRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _playerSkillRepository = playerSkillRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>技能配置表（右树：属性技能）</summary>
    private static readonly List<SkillConfig> _attributeSkillConfigs = new()
    {
        new()
        {
            SkillId = "ATTR_ATTACK_1",
            Name = "攻击强化 I",
            Description = "基础攻击力 +5%",
            MaxLevel = 5,
            RequiredLevel = 1,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_attack_1"
        },
        new()
        {
            SkillId = "ATTR_ATTACK_2",
            Name = "攻击强化 II",
            Description = "基础攻击力 +10%",
            MaxLevel = 5,
            RequiredLevel = 5,
            Cost = 2,
            PreconditionSkillId = "ATTR_ATTACK_1",
            Icon = "skill_attack_2"
        },
        new()
        {
            SkillId = "ATTR_ATTACK_3",
            Name = "攻击强化 III",
            Description = "基础攻击力 +15%",
            MaxLevel = 5,
            RequiredLevel = 10,
            Cost = 3,
            PreconditionSkillId = "ATTR_ATTACK_2",
            Icon = "skill_attack_3"
        },
        new()
        {
            SkillId = "ATTR_HEALTH_1",
            Name = "生命强化 I",
            Description = "最大生命值 +8%",
            MaxLevel = 5,
            RequiredLevel = 1,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_health_1"
        },
        new()
        {
            SkillId = "ATTR_HEALTH_2",
            Name = "生命强化 II",
            Description = "最大生命值 +15%",
            MaxLevel = 5,
            RequiredLevel = 6,
            Cost = 2,
            PreconditionSkillId = "ATTR_HEALTH_1",
            Icon = "skill_health_2"
        },
        new()
        {
            SkillId = "ATTR_DEFENSE_1",
            Name = "防御强化 I",
            Description = "防御力 +6%",
            MaxLevel = 5,
            RequiredLevel = 2,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_defense_1"
        },
        new()
        {
            SkillId = "ATTR_DEFENSE_2",
            Name = "防御强化 II",
            Description = "防御力 +12%",
            MaxLevel = 5,
            RequiredLevel = 7,
            Cost = 2,
            PreconditionSkillId = "ATTR_DEFENSE_1",
            Icon = "skill_defense_2"
        },
        new()
        {
            SkillId = "ATTR_CRIT_1",
            Name = "暴击精通 I",
            Description = "暴击率 +3%，暴击伤害 +10%",
            MaxLevel = 5,
            RequiredLevel = 3,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_crit_1"
        },
        new()
        {
            SkillId = "ATTR_CRIT_2",
            Name = "暴击精通 II",
            Description = "暴击率 +5%，暴击伤害 +20%",
            MaxLevel = 5,
            RequiredLevel = 8,
            Cost = 2,
            PreconditionSkillId = "ATTR_CRIT_1",
            Icon = "skill_crit_2"
        },
        new()
        {
            SkillId = "ATTR_SPEED_1",
            Name = "攻速强化 I",
            Description = "攻击速度 +5%",
            MaxLevel = 5,
            RequiredLevel = 4,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_speed_1"
        },
        new()
        {
            SkillId = "ATTR_SPEED_2",
            Name = "攻速强化 II",
            Description = "攻击速度 +10%",
            MaxLevel = 5,
            RequiredLevel = 9,
            Cost = 2,
            PreconditionSkillId = "ATTR_SPEED_1",
            Icon = "skill_speed_2"
        }
    };

    /// <summary>技能配置表（左树：特效技能）</summary>
    private static readonly List<SkillConfig> _effectSkillConfigs = new()
    {
        new()
        {
            SkillId = "EFF_BURN_1",
            Name = "烈焰附魔 I",
            Description = "攻击有 10% 几率触发灼烧，每秒造成攻击力 5% 的伤害，持续 3 秒",
            MaxLevel = 5,
            RequiredLevel = 1,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_burn_1"
        },
        new()
        {
            SkillId = "EFF_BURN_2",
            Name = "烈焰附魔 II",
            Description = "攻击有 15% 几率触发灼烧，每秒造成攻击力 10% 的伤害，持续 4 秒",
            MaxLevel = 5,
            RequiredLevel = 5,
            Cost = 2,
            PreconditionSkillId = "EFF_BURN_1",
            Icon = "skill_burn_2"
        },
        new()
        {
            SkillId = "EFF_POISON_1",
            Name = "剧毒附魔 I",
            Description = "攻击有 8% 几率触发中毒，每秒造成攻击力 4% 的伤害，持续 5 秒",
            MaxLevel = 5,
            RequiredLevel = 2,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_poison_1"
        },
        new()
        {
            SkillId = "EFF_POISON_2",
            Name = "剧毒附魔 II",
            Description = "攻击有 12% 几率触发中毒，每秒造成攻击力 8% 的伤害，持续 6 秒",
            MaxLevel = 5,
            RequiredLevel = 7,
            Cost = 2,
            PreconditionSkillId = "EFF_POISON_1",
            Icon = "skill_poison_2"
        },
        new()
        {
            SkillId = "EFF_ICE_1",
            Name = "寒冰附魔 I",
            Description = "攻击有 7% 几率触发减速，目标移动/攻击速度降低 20%，持续 2 秒",
            MaxLevel = 5,
            RequiredLevel = 3,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_ice_1"
        },
        new()
        {
            SkillId = "EFF_ICE_2",
            Name = "寒冰附魔 II",
            Description = "攻击有 10% 几率触发冰冻，目标短暂无法行动 0.5 秒",
            MaxLevel = 5,
            RequiredLevel = 8,
            Cost = 2,
            PreconditionSkillId = "EFF_ICE_1",
            Icon = "skill_ice_2"
        },
        new()
        {
            SkillId = "EFF_LIGHTNING_1",
            Name = "雷电附魔 I",
            Description = "攻击有 6% 几率触发连锁闪电，额外攻击附近 1 个目标，伤害 50%",
            MaxLevel = 5,
            RequiredLevel = 4,
            Cost = 1,
            PreconditionSkillId = null,
            Icon = "skill_lightning_1"
        },
        new()
        {
            SkillId = "EFF_LIGHTNING_2",
            Name = "雷电附魔 II",
            Description = "攻击有 10% 几率触发连锁闪电，额外攻击附近 2 个目标，伤害 75%",
            MaxLevel = 5,
            RequiredLevel = 9,
            Cost = 2,
            PreconditionSkillId = "EFF_LIGHTNING_1",
            Icon = "skill_lightning_2"
        },
        new()
        {
            SkillId = "EFF_LIFELEECH_1",
            Name = "生命汲取 I",
            Description = "吸血效果 +3%",
            MaxLevel = 5,
            RequiredLevel = 6,
            Cost = 2,
            PreconditionSkillId = null,
            Icon = "skill_lifeleech_1"
        },
        new()
        {
            SkillId = "EFF_LIFELEECH_2",
            Name = "生命汲取 II",
            Description = "吸血效果 +7%",
            MaxLevel = 5,
            RequiredLevel = 10,
            Cost = 3,
            PreconditionSkillId = "EFF_LIFELEECH_1",
            Icon = "skill_lifeleech_2"
        }
    };

    /// <summary>技能配置表（分身技能）</summary>
    private static readonly List<SkillConfig> _cloneSkillConfigs = new()
    {
        new()
        {
            SkillId = "CLONE_SUMMON_1",
            Name = "召唤分身 I",
            Description = "召唤 1 个分身，继承 30% 属性，持续 15 秒，冷却 30 秒",
            MaxLevel = 3,
            RequiredLevel = 5,
            Cost = 3,
            PreconditionSkillId = null,
            Icon = "skill_clone_1"
        },
        new()
        {
            SkillId = "CLONE_SUMMON_2",
            Name = "召唤分身 II",
            Description = "召唤 1 个分身，继承 50% 属性，持续 20 秒，冷却 25 秒",
            MaxLevel = 3,
            RequiredLevel = 10,
            Cost = 4,
            PreconditionSkillId = "CLONE_SUMMON_1",
            Icon = "skill_clone_2"
        },
        new()
        {
            SkillId = "CLONE_SUMMON_3",
            Name = "召唤分身 III",
            Description = "召唤 2 个分身，继承 60% 属性，持续 25 秒，冷却 20 秒",
            MaxLevel = 3,
            RequiredLevel = 15,
            Cost = 5,
            PreconditionSkillId = "CLONE_SUMMON_2",
            Icon = "skill_clone_3"
        },
        new()
        {
            SkillId = "CLONE_DAMAGE_1",
            Name = "分身强化 I",
            Description = "分身伤害 +15%",
            MaxLevel = 5,
            RequiredLevel = 6,
            Cost = 2,
            PreconditionSkillId = "CLONE_SUMMON_1",
            Icon = "skill_clone_damage_1"
        },
        new()
        {
            SkillId = "CLONE_DAMAGE_2",
            Name = "分身强化 II",
            Description = "分身伤害 +30%，分身获得暴击属性",
            MaxLevel = 5,
            RequiredLevel = 12,
            Cost = 3,
            PreconditionSkillId = "CLONE_DAMAGE_1",
            Icon = "skill_clone_damage_2"
        },
        new()
        {
            SkillId = "CLONE_DURATION_1",
            Name = "分身持续 I",
            Description = "分身持续时间 +25%",
            MaxLevel = 5,
            RequiredLevel = 7,
            Cost = 2,
            PreconditionSkillId = "CLONE_SUMMON_1",
            Icon = "skill_clone_duration_1"
        },
        new()
        {
            SkillId = "CLONE_DURATION_2",
            Name = "分身持续 II",
            Description = "分身持续时间 +50%，分身死亡时自爆造成范围伤害",
            MaxLevel = 5,
            RequiredLevel = 13,
            Cost = 3,
            PreconditionSkillId = "CLONE_DURATION_1",
            Icon = "skill_clone_duration_2"
        },
        new()
        {
            SkillId = "CLONE_TANK_1",
            Name = "分身守护 I",
            Description = "分身生命值 +20%，嘲讽周围敌人",
            MaxLevel = 5,
            RequiredLevel = 8,
            Cost = 2,
            PreconditionSkillId = "CLONE_SUMMON_1",
            Icon = "skill_clone_tank_1"
        }
    };

    /// <summary>
    /// 获取玩家完整技能树（属性技能树与战斗技能树），返回各技能当前等级、可用技能点与解锁状态
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>技能树输出，玩家不存在返回 null</returns>
    public async Task<SkillTreeOutput?> GetSkillTreeAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var playerSkills = await _context.PlayerSkills
            .Where(ps => ps.PlayerId == playerId && !ps.IsDeleted)
            .ToDictionaryAsync(ps => ps.SkillId, ps => ps.Level);

        var usedPoints = 0;
        var attributeSkills = BuildSkillOutputList(_attributeSkillConfigs, playerSkills, player.Level, ref usedPoints);
        var effectSkills = BuildSkillOutputList(_effectSkillConfigs, playerSkills, player.Level, ref usedPoints);
        var cloneSkills = BuildSkillOutputList(_cloneSkillConfigs, playerSkills, player.Level, ref usedPoints);

        return new SkillTreeOutput
        {
            AttributeSkills = attributeSkills,
            EffectSkills = effectSkills,
            CloneSkills = cloneSkills,
            UsedPoints = usedPoints,
            AvailablePoints = player.SkillPoints
        };
    }

    /// <summary>
    /// 升级指定技能：校验技能点是否足够、玩家等级是否达到要求、前置技能是否满足，扣除技能点并升级
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">升级参数（技能 ID）</param>
    /// <returns>升级后技能输出，玩家不存在或条件不满足返回 null</returns>
    public async Task<SkillOutput?> UpgradeSkillAsync(string playerId, UpgradeSkillInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var allConfigs = _attributeSkillConfigs
            .Concat(_effectSkillConfigs)
            .Concat(_cloneSkillConfigs)
            .ToDictionary(c => c.SkillId);

        if (!allConfigs.TryGetValue(input.SkillId, out var config))
        {
            return null;
        }

        var playerSkill = await _context.PlayerSkills
            .FirstOrDefaultAsync(ps => ps.PlayerId == playerId && ps.SkillId == input.SkillId && !ps.IsDeleted);

        var currentLevel = playerSkill?.Level ?? 0;
        if (currentLevel >= config.MaxLevel)
        {
            return null;
        }

        if (player.Level < config.RequiredLevel)
        {
            return null;
        }

        if (!string.IsNullOrEmpty(config.PreconditionSkillId))
        {
            var preSkill = await _context.PlayerSkills
                .FirstOrDefaultAsync(ps => ps.PlayerId == playerId && ps.SkillId == config.PreconditionSkillId && !ps.IsDeleted);
            if (preSkill == null || preSkill.Level < 1)
            {
                return null;
            }
        }

        var cost = config.Cost;
        if (player.SkillPoints < cost)
        {
            return null;
        }

        player.SkillPoints -= cost;
        player.LastActiveAt = DateTimeOffset.UtcNow;

        if (playerSkill == null)
        {
            playerSkill = new PlayerSkill
            {
                PlayerId = playerId,
                SkillId = input.SkillId,
                Level = 1
            };
            await _playerSkillRepository.AddAsync(playerSkill);
        }
        else
        {
            playerSkill.Level += 1;
            playerSkill.ModifiedAt = DateTimeOffset.UtcNow;
            await _playerSkillRepository.UpdateAsync(playerSkill);
        }

        await _playerRepository.UpdateAsync(player);

        return new SkillOutput
        {
            SkillId = config.SkillId,
            Name = config.Name,
            Description = config.Description,
            Level = playerSkill.Level,
            MaxLevel = config.MaxLevel,
            Unlocked = playerSkill.Level >= 1,
            RequiredLevel = config.RequiredLevel,
            Cost = config.Cost,
            PreconditionSkillId = config.PreconditionSkillId,
            Icon = config.Icon
        };
    }

    /// <summary>
    /// 降级指定技能：返还全部技能点，检查该技能是否是其他技能的前置（有依赖则不可降级）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">降级参数（技能 ID）</param>
    /// <returns>降级后技能输出，玩家不存在或条件不满足返回 null</returns>
    public async Task<SkillOutput?> DowngradeSkillAsync(string playerId, DowngradeSkillInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var allConfigs = _attributeSkillConfigs
            .Concat(_effectSkillConfigs)
            .Concat(_cloneSkillConfigs)
            .ToList();

        var configDict = allConfigs.ToDictionary(c => c.SkillId);
        if (!configDict.TryGetValue(input.SkillId, out var config))
        {
            return null;
        }

        var dependentSkills = allConfigs
            .Where(c => c.PreconditionSkillId == input.SkillId)
            .ToList();

        foreach (var dep in dependentSkills)
        {
            var depSkill = await _context.PlayerSkills
                .FirstOrDefaultAsync(ps => ps.PlayerId == playerId && ps.SkillId == dep.SkillId && !ps.IsDeleted);
            if (depSkill != null && depSkill.Level >= 1)
            {
                return null;
            }
        }

        var playerSkill = await _context.PlayerSkills
            .FirstOrDefaultAsync(ps => ps.PlayerId == playerId && ps.SkillId == input.SkillId && !ps.IsDeleted);

        if (playerSkill == null || playerSkill.Level <= 0)
        {
            return null;
        }

        var refundPoints = playerSkill.Level * config.Cost;
        player.SkillPoints += refundPoints;
        player.LastActiveAt = DateTimeOffset.UtcNow;

        playerSkill.Level = 0;
        playerSkill.IsDeleted = true;
        playerSkill.DeletedAt = DateTimeOffset.UtcNow;
        playerSkill.ModifiedAt = DateTimeOffset.UtcNow;
        await _playerSkillRepository.UpdateAsync(playerSkill);

        await _playerRepository.UpdateAsync(player);

        return new SkillOutput
        {
            SkillId = config.SkillId,
            Name = config.Name,
            Description = config.Description,
            Level = 0,
            MaxLevel = config.MaxLevel,
            Unlocked = false,
            RequiredLevel = config.RequiredLevel,
            Cost = config.Cost,
            PreconditionSkillId = config.PreconditionSkillId,
            Icon = config.Icon
        };
    }

    private static List<SkillOutput> BuildSkillOutputList(
        List<SkillConfig> configs,
        Dictionary<string, int> playerSkills,
        int playerLevel,
        ref int usedPoints)
    {
        var result = new List<SkillOutput>();
        foreach (var config in configs)
        {
            playerSkills.TryGetValue(config.SkillId, out var level);
            var unlocked = level >= 1;

            bool preconditionMet = true;
            if (!string.IsNullOrEmpty(config.PreconditionSkillId))
            {
                playerSkills.TryGetValue(config.PreconditionSkillId, out var preLevel);
                preconditionMet = preLevel >= 1;
            }

            var levelMet = playerLevel >= config.RequiredLevel;

            result.Add(new SkillOutput
            {
                SkillId = config.SkillId,
                Name = config.Name,
                Description = config.Description,
                Level = level,
                MaxLevel = config.MaxLevel,
                Unlocked = unlocked,
                RequiredLevel = config.RequiredLevel,
                Cost = unlocked ? 0 : (preconditionMet && levelMet ? config.Cost : 0),
                PreconditionSkillId = config.PreconditionSkillId,
                Icon = config.Icon
            });

            usedPoints += level * config.Cost;
        }
        return result;
    }

    /// <summary>技能配置内部类</summary>
    private class SkillConfig
    {
        public string SkillId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MaxLevel { get; set; }
        public int RequiredLevel { get; set; }
        public int Cost { get; set; }
        public string? PreconditionSkillId { get; set; }
        public string Icon { get; set; } = string.Empty;
    }
}
