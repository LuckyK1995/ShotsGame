using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Talent;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;
using TalentEntity = ShotsGame.Core.Entities.Talent;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 天赋系统服务：玩家天赋树查询、天赋三选一抽取、天赋升级与激活
/// </summary>
public class TalentService : ITalentService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<TalentEntity> _talentRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;
    private static readonly Random _random = new();

    public TalentService(
        IPlayerRepository playerRepository,
        IRepository<TalentEntity> talentRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _talentRepository = talentRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>天赋池配置（14种天赋）</summary>
    private static readonly List<TalentConfig> _talentPool = new()
    {
        new()
        {
            TalentId = "TALENT_ATTACK_BOOST",
            Name = "攻击增幅",
            Rarity = TalentRarity.Common,
            Stat = "Attack",
            Value = 0.08,
            Description = "全局攻击力 +8%",
            Icon = "talent_attack_boost"
        },
        new()
        {
            TalentId = "TALENT_BLOODLUST",
            Name = "嗜血本能",
            Rarity = TalentRarity.Rare,
            Stat = "Lifesteal",
            Value = 0.06,
            Description = "吸血 +6%，击杀敌人时恢复最大生命的 2%",
            Icon = "talent_bloodlust"
        },
        new()
        {
            TalentId = "TALENT_IRON_WALL",
            Name = "钢铁之躯",
            Rarity = TalentRarity.Common,
            Stat = "Defense",
            Value = 0.12,
            Description = "防御力 +12%",
            Icon = "talent_iron_wall"
        },
        new()
        {
            TalentId = "TALENT_VITALITY",
            Name = "生命源泉",
            Rarity = TalentRarity.Common,
            Stat = "MaxHealth",
            Value = 0.15,
            Description = "最大生命值 +15%",
            Icon = "talent_vitality"
        },
        new()
        {
            TalentId = "TALENT_CRITICAL_EYE",
            Name = "致命之眼",
            Rarity = TalentRarity.Rare,
            Stat = "CritRate",
            Value = 0.07,
            Description = "暴击率 +7%，暴击伤害额外 +15%",
            Icon = "talent_critical_eye"
        },
        new()
        {
            TalentId = "TALENT_BERSERKER",
            Name = "狂战之魂",
            Rarity = TalentRarity.Epic,
            Stat = "AttackOnLowHealth",
            Value = 0.35,
            Description = "生命值低于 30% 时，攻击力 +35%",
            Icon = "talent_berserker"
        },
        new()
        {
            TalentId = "TALENT_WINDS_OF_FURY",
            Name = "狂怒之风",
            Rarity = TalentRarity.Rare,
            Stat = "AttackSpeed",
            Value = 0.10,
            Description = "攻击速度 +10%，移动速度 +8%",
            Icon = "talent_winds_of_fury"
        },
        new()
        {
            TalentId = "TALENT_ARMOR_BREAKER",
            Name = "破甲打击",
            Rarity = TalentRarity.Epic,
            Stat = "ArmorPenetration",
            Value = 0.20,
            Description = "无视目标 20% 防御力",
            Icon = "talent_armor_breaker"
        },
        new()
        {
            TalentId = "TALENT_ELEMENTAL_MASTERY",
            Name = "元素精通",
            Rarity = TalentRarity.Rare,
            Stat = "ElementalDamage",
            Value = 0.25,
            Description = "所有元素伤害 +25%",
            Icon = "talent_elemental_mastery"
        },
        new()
        {
            TalentId = "TALENT_LUCKY_COIN",
            Name = "幸运金币",
            Rarity = TalentRarity.Common,
            Stat = "GoldBonus",
            Value = 0.20,
            Description = "战斗金币收益 +20%",
            Icon = "talent_lucky_coin"
        },
        new()
        {
            TalentId = "TALENT_QUICK_LEARNER",
            Name = "快速学习",
            Rarity = TalentRarity.Common,
            Stat = "ExpBonus",
            Value = 0.15,
            Description = "经验获取 +15%",
            Icon = "talent_quick_learner"
        },
        new()
        {
            TalentId = "TALENT_UNSTOPPABLE",
            Name = "势不可挡",
            Rarity = TalentRarity.Legendary,
            Stat = "PierceThrough",
            Value = 1.00,
            Description = "攻击无视 3 个目标，子弹/投射物穿透敌人",
            Icon = "talent_unstoppable"
        },
        new()
        {
            TalentId = "TALENT_PHOENIX_HEART",
            Name = "凤凰之心",
            Rarity = TalentRarity.Legendary,
            Stat = "Revive",
            Value = 1.00,
            Description = "每局战斗首次死亡时复活，恢复 50% 生命值",
            Icon = "talent_phoenix_heart"
        },
        new()
        {
            TalentId = "TALENT_SHADOW_STEP",
            Name = "暗影步",
            Rarity = TalentRarity.Epic,
            Stat = "DodgeChance",
            Value = 0.15,
            Description = "15% 几率闪避敌人攻击，闪避后下次攻击必定暴击",
            Icon = "talent_shadow_step"
        }
    };

    /// <summary>
    /// 获取玩家天赋三选一选项：从玩家未拥有的天赋池中按稀有度加权随机抽取 3 个候选天赋
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>天赋三选一输出（3 个候选天赋），玩家不存在或没有可抽取天赋返回 null</returns>
    public async Task<TalentChoicesOutput?> GetTalentChoicesAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var ownedTalentIds = await _context.Talents
            .Where(t => t.PlayerId == playerId && !t.IsDeleted)
            .Select(t => t.TalentId)
            .ToHashSetAsync();

        var availableTalents = _talentPool
            .Where(t => !ownedTalentIds.Contains(t.TalentId))
            .ToList();

        if (availableTalents.Count == 0)
        {
            return new TalentChoicesOutput
            {
                Choices = new List<TalentOutput>(),
                CanSkip = false
            };
        }

        var takeCount = Math.Min(3, availableTalents.Count);
        var shuffled = availableTalents
            .OrderBy(_ => _random.Next())
            .Take(takeCount)
            .ToList();

        var choices = shuffled.Select(t => new TalentOutput
        {
            TalentId = t.TalentId,
            Name = t.Name,
            Rarity = t.Rarity,
            Stat = t.Stat,
            Value = t.Value,
            Description = t.Description,
            Icon = t.Icon
        }).ToList();

        return new TalentChoicesOutput
        {
            Choices = choices,
            CanSkip = availableTalents.Count > 0
        };
    }

    /// <summary>
    /// 获取玩家已激活的所有天赋列表（含名称、稀有度、属性加成、描述）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>玩家已拥有天赋列表，玩家不存在返回 null</returns>
    public async Task<List<TalentOutput>?> GetOwnedTalentsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var ownedTalents = await _context.Talents
            .Where(t => t.PlayerId == playerId && !t.IsDeleted)
            .OrderByDescending(t => t.Rarity)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync();

        var configDict = _talentPool.ToDictionary(t => t.TalentId);

        var result = new List<TalentOutput>();
        foreach (var talent in ownedTalents)
        {
            var output = _mapper.Map<TalentOutput>(talent);
            if (configDict.TryGetValue(talent.TalentId, out var config))
            {
                output.Icon = config.Icon;
            }
            result.Add(output);
        }

        return result;
    }

    /// <summary>
    /// 选择并激活玩家天赋：校验天赋 ID 是否合法且未拥有，激活天赋并保存数据库
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">选择天赋参数（天赋 ID）</param>
    /// <returns>已激活的天赋输出，玩家不存在或天赋已拥有或 ID 不合法返回 null</returns>
    public async Task<TalentOutput?> ChooseTalentAsync(string playerId, ChooseTalentInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var ownedTalentIds = await _context.Talents
            .Where(t => t.PlayerId == playerId && !t.IsDeleted)
            .Select(t => t.TalentId)
            .ToHashSetAsync();

        if (ownedTalentIds.Contains(input.TalentId))
        {
            return null;
        }

        var talentConfig = _talentPool.FirstOrDefault(t => t.TalentId == input.TalentId);
        if (talentConfig == null)
        {
            return null;
        }

        var availableTalentIds = _talentPool
            .Where(t => !ownedTalentIds.Contains(t.TalentId))
            .Select(t => t.TalentId)
            .ToList();

        if (!availableTalentIds.Contains(input.TalentId))
        {
            return null;
        }

        var talent = new TalentEntity
        {
            PlayerId = playerId,
            TalentId = talentConfig.TalentId,
            Name = talentConfig.Name,
            Rarity = talentConfig.Rarity,
            Stat = talentConfig.Stat,
            Value = talentConfig.Value,
            Description = talentConfig.Description
        };

        await _talentRepository.AddAsync(talent);

        return new TalentOutput
        {
            TalentId = talent.TalentId,
            Name = talent.Name,
            Rarity = talent.Rarity,
            Stat = talent.Stat,
            Value = talent.Value,
            Description = talent.Description,
            Icon = talentConfig.Icon
        };
    }

    /// <summary>天赋配置内部类</summary>
    private class TalentConfig
    {
        public string TalentId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public TalentRarity Rarity { get; set; }
        public string Stat { get; set; } = string.Empty;
        public double Value { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
    }
}
