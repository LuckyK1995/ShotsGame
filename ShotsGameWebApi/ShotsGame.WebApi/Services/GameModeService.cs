using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Inventory;
using GameModeNs = ShotsGame.Core.DTOs.GameMode;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 游戏模式服务：管理关卡、世界BOSS、炼狱、日常、材料副本、镜像、守卫战、家园守卫等游戏模式的配置、解锁、开始及每日挑战次数
/// </summary>
public class GameModeService : IGameModeService
{
    private static readonly Dictionary<DifficultyLevel, (double Enemy, double Reward)> DifficultyMultipliers = new()
    {
        { DifficultyLevel.Easy, (0.6, 0.7) },
        { DifficultyLevel.Normal, (1.0, 1.0) },
        { DifficultyLevel.Hard, (1.8, 1.8) },
        { DifficultyLevel.Nightmare, (3.0, 3.0) }
    };

    private static readonly List<GameModeConfig> ModeConfigs = new()
    {
        new GameModeConfig
        {
            Mode = GameMode.Stage,
            Name = "关卡",
            Description = "经典闯关模式，逐关挑战，击败所有敌人通关",
            UnlockLevel = 1,
            MaxDailyAttempts = null,
            Features = new List<string> { "经典闯关", "逐关递进", "解锁新内容" }
        },
        new GameModeConfig
        {
            Mode = GameMode.WorldBoss,
            Name = "世界BOSS",
            Description = "限时挑战强力BOSS，每日有限挑战次数",
            UnlockLevel = 10,
            MaxDailyAttempts = 3,
            TimeLimitSeconds = 300,
            Features = new List<string> { "限时5分钟", "强力BOSS", "每日3次" }
        },
        new GameModeConfig
        {
            Mode = GameMode.Purgatory,
            Name = "炼狱",
            Description = "极高难度模式，只有1条命，敌人伤害翻倍",
            UnlockLevel = 15,
            MaxDailyAttempts = null,
            Features = new List<string> { "1条命", "敌人伤害翻倍", "极限挑战" }
        },
        new GameModeConfig
        {
            Mode = GameMode.Daily,
            Name = "日常",
            Description = "单波无限模式，敌人速度5倍，快速获取资源",
            UnlockLevel = 5,
            MaxDailyAttempts = null,
            Features = new List<string> { "单波无限", "敌人速度5x", "快速资源" }
        },
        new GameModeConfig
        {
            Mode = GameMode.Material,
            Name = "材料",
            Description = "材料副本，每日有限挑战次数，获取各类强化材料",
            UnlockLevel = 8,
            MaxDailyAttempts = 5,
            Features = new List<string> { "每日5次", "材料奖励", "多种副本" }
        },
        new GameModeConfig
        {
            Mode = GameMode.Mirror,
            Name = "镜像",
            Description = "1v1 AI对战，限时3分钟，考验操作技巧",
            UnlockLevel = 20,
            MaxDailyAttempts = 5,
            TimeLimitSeconds = 180,
            Features = new List<string> { "1v1 AI对战", "限时3分钟", "每日5次" }
        },
        new GameModeConfig
        {
            Mode = GameMode.Guard,
            Name = "守卫战",
            Description = "保护基地不被摧毁，基地血量随等级提升",
            UnlockLevel = 12,
            MaxDailyAttempts = null,
            Features = new List<string> { "保护基地", "基地血量500+level*20", "防守挑战" }
        },
        new GameModeConfig
        {
            Mode = GameMode.HomeDefense,
            Name = "家园守卫",
            Description = "多方向敌人进攻，可建造防御塔协助防守",
            UnlockLevel = 25,
            MaxDailyAttempts = null,
            Features = new List<string> { "多方向敌人", "防御塔支援", "高等级解锁" }
        }
    };

    private static readonly List<MaterialDungeonConfig> MaterialDungeons = new()
    {
        new MaterialDungeonConfig
        {
            Type = MaterialDungeonType.Enhance,
            Name = "强化石矿洞",
            Description = "获取强化石，用于装备强化",
            PreviewItems = new List<(string ItemId, int Count, string Name)>
            {
                ("enhance_stone_common", 5, "普通强化石"),
                ("enhance_stone_advanced", 2, "高级强化石")
            }
        },
        new MaterialDungeonConfig
        {
            Type = MaterialDungeonType.Gem,
            Name = "宝石矿洞",
            Description = "获取各类宝石，用于装备镶嵌",
            PreviewItems = new List<(string ItemId, int Count, string Name)>
            {
                ("gem_attack_common", 2, "攻击宝石(普通)"),
                ("gem_health_common", 2, "生命宝石(普通)")
            }
        },
        new MaterialDungeonConfig
        {
            Type = MaterialDungeonType.Enchant,
            Name = "附魔秘境",
            Description = "获取附魔书，用于装备附魔",
            PreviewItems = new List<(string ItemId, int Count, string Name)>
            {
                ("enchant_book_common", 2, "普通附魔书"),
                ("enchant_book_advanced", 1, "高级附魔书")
            }
        },
        new MaterialDungeonConfig
        {
            Type = MaterialDungeonType.Exp,
            Name = "经验秘境",
            Description = "大量经验奖励，快速升级",
            PreviewItems = new List<(string ItemId, int Count, string Name)>
            {
                ("exp_book_small", 3, "小型经验书"),
                ("exp_book_medium", 1, "中型经验书")
            }
        },
        new MaterialDungeonConfig
        {
            Type = MaterialDungeonType.Gold,
            Name = "金币矿洞",
            Description = "大量金币奖励",
            PreviewItems = new List<(string ItemId, int Count, string Name)>
            {
                ("gold_chest_small", 2, "小宝箱"),
                ("gold_chest_medium", 1, "中宝箱")
            }
        }
    };

    private readonly IPlayerRepository _playerRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public GameModeService(
        IPlayerRepository playerRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 获取玩家可用的游戏模式列表（含解锁状态、今日已挑战次数、难度倍率等信息）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>游戏模式列表输出，玩家不存在返回 null</returns>
    public async Task<GameModeNs.GameModeListOutput?> GetGameModesAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var todayStart = DateTimeOffset.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        var todayBattleRecords = await _context.BattleRecords
            .Where(r => r.PlayerId == playerId && r.PlayedAt >= todayStart && r.PlayedAt < todayEnd && !r.IsDeleted)
            .ToListAsync();

        var modes = new List<GameModeNs.GameModeOutput>();

        foreach (var config in ModeConfigs)
        {
            var isUnlocked = player.Level >= config.UnlockLevel;
            var todayAttempts = todayBattleRecords.Count(r => r.Mode == config.Mode);

            var defaultDifficulty = DifficultyLevel.Normal;
            var (enemyMult, rewardMult) = DifficultyMultipliers[defaultDifficulty];

            modes.Add(new GameModeNs.GameModeOutput
            {
                Mode = config.Mode,
                Name = config.Name,
                Description = config.Description,
                UnlockLevel = config.UnlockLevel,
                MaxDailyAttempts = config.MaxDailyAttempts,
                TodayAttempts = isUnlocked ? todayAttempts : 0,
                EnemyMultiplier = enemyMult,
                RewardMultiplier = rewardMult,
                Difficulty = defaultDifficulty,
                Features = new List<string>(config.Features)
            });
        }

        return new GameModeNs.GameModeListOutput
        {
            Modes = modes,
            PlayerLevel = player.Level
        };
    }

    /// <summary>
    /// 开始游戏：校验模式解锁等级与每日次数上限，生成会话 ID 返回开局参数
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">开局参数（游戏模式、难度、材料副本类型等）</param>
    /// <returns>开局输出（会话 ID、模式、难度、波次、限时、特性说明等），玩家不存在或模式未解锁或次数不足返回 null</returns>
    public async Task<GameModeNs.StartGameOutput?> StartGameAsync(string playerId, GameModeNs.StartGameInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var config = ModeConfigs.FirstOrDefault(c => c.Mode == input.Mode);
        if (config == null)
        {
            return null;
        }

        if (player.Level < config.UnlockLevel)
        {
            return null;
        }

        if (config.MaxDailyAttempts.HasValue)
        {
            var todayStart = DateTimeOffset.UtcNow.Date;
            var todayEnd = todayStart.AddDays(1);

            var todayAttempts = await _context.BattleRecords
                .CountAsync(r => r.PlayerId == playerId
                    && r.Mode == input.Mode
                    && r.PlayedAt >= todayStart
                    && r.PlayedAt < todayEnd
                    && !r.IsDeleted);

            if (todayAttempts >= config.MaxDailyAttempts.Value)
            {
                return null;
            }
        }

        var sessionId = Guid.NewGuid().ToString();

        var features = new List<string>(config.Features);
        if (DifficultyMultipliers.TryGetValue(input.Difficulty, out var mult))
        {
            features.Add($"难度倍率: 敌人x{mult.Enemy}, 奖励x{mult.Reward}");
        }

        if (input.MaterialType.HasValue)
        {
            var dungeon = MaterialDungeons.FirstOrDefault(d => d.Type == input.MaterialType.Value);
            if (dungeon != null)
            {
                features.Add($"材料类型: {dungeon.Name}");
            }
        }

        if (input.Mode == GameMode.Guard)
        {
            var baseHealth = 500 + player.Level * 20;
            features.Add($"基地血量: {baseHealth}");
        }

        return new GameModeNs.StartGameOutput
        {
            SessionId = sessionId,
            Mode = input.Mode,
            Difficulty = input.Difficulty,
            Wave = 1,
            TimeLimitSeconds = config.TimeLimitSeconds,
            Features = features
        };
    }

    /// <summary>
    /// 获取材料副本列表（含今日已挑战次数、奖励预览等信息）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>材料副本列表输出，玩家不存在返回 null</returns>
    public async Task<GameModeNs.MaterialDungeonListOutput?> GetMaterialDungeonsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var todayStart = DateTimeOffset.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        var todayMaterialAttempts = await _context.BattleRecords
            .CountAsync(r => r.PlayerId == playerId
                && r.Mode == GameMode.Material
                && r.PlayedAt >= todayStart
                && r.PlayedAt < todayEnd
                && !r.IsDeleted);

        var dungeons = MaterialDungeons.Select(d => new GameModeNs.MaterialDungeonInfo
        {
            Type = d.Type,
            Name = d.Name,
            Description = d.Description,
            MaxDailyAttempts = 5,
            TodayAttempts = todayMaterialAttempts,
            RewardPreview = d.PreviewItems.Select(p => new ItemStackOutput
            {
                ItemId = p.ItemId,
                Count = p.Count,
                Name = p.Name,
                Icon = null,
                Description = null,
                Rarity = GetItemRarity(p.ItemId),
                Type = GetItemType(p.ItemId)
            }).ToList()
        }).ToList();

        return new GameModeNs.MaterialDungeonListOutput
        {
            Dungeons = dungeons,
            PlayerLevel = player.Level
        };
    }

    private static EquipRarity GetItemRarity(string itemId)
    {
        if (itemId.Contains("_mythic", StringComparison.OrdinalIgnoreCase))
            return EquipRarity.Mythic;
        if (itemId.Contains("_epic", StringComparison.OrdinalIgnoreCase))
            return EquipRarity.Epic;
        if (itemId.Contains("_legendary", StringComparison.OrdinalIgnoreCase))
            return EquipRarity.Legendary;
        if (itemId.Contains("_fine", StringComparison.OrdinalIgnoreCase))
            return EquipRarity.Fine;
        if (itemId.Contains("_advanced", StringComparison.OrdinalIgnoreCase))
            return EquipRarity.Advanced;
        return EquipRarity.Common;
    }

    private static string GetItemType(string itemId)
    {
        if (itemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase))
            return "Gem";
        if (itemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase))
            return "Enchant";
        if (itemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase))
            return "Enhance";
        return "Item";
    }

    private class GameModeConfig
    {
        public ShotsGame.Core.Enums.GameMode Mode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int UnlockLevel { get; set; }
        public int? MaxDailyAttempts { get; set; }
        public int? TimeLimitSeconds { get; set; }
        public List<string> Features { get; set; } = new();
    }

    private class MaterialDungeonConfig
    {
        public MaterialDungeonType Type { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<(string ItemId, int Count, string Name)> PreviewItems { get; set; } = new();
    }
}
