using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.SaveData;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 存档服务：保存 JSON 快照、读取存档、聚合全量玩家数据导出、重置玩家存档
/// </summary>
public class SaveDataService : ISaveDataService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<SaveDataSnapshot> _saveSnapshotRepository;
    private readonly IRepository<Equipment> _equipmentRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly IRepository<PlayerSkill> _playerSkillRepository;
    private readonly IRepository<ShotsGame.Core.Entities.Talent> _talentRepository;
    private readonly IRepository<CodexEntry> _codexRepository;
    private readonly IRepository<Achievement> _achievementRepository;
    private readonly IRepository<Mail> _mailRepository;
    private readonly IRepository<CheckInRecord> _checkInRepository;
    private readonly IRepository<OnlineRewardRecord> _onlineRewardRepository;
    private readonly IRepository<LotteryRecord> _lotteryRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public SaveDataService(
        IPlayerRepository playerRepository,
        IRepository<SaveDataSnapshot> saveSnapshotRepository,
        IRepository<Equipment> equipmentRepository,
        IRepository<ItemStack> itemStackRepository,
        IRepository<PlayerSkill> playerSkillRepository,
        IRepository<ShotsGame.Core.Entities.Talent> talentRepository,
        IRepository<CodexEntry> codexRepository,
        IRepository<Achievement> achievementRepository,
        IRepository<Mail> mailRepository,
        IRepository<CheckInRecord> checkInRepository,
        IRepository<OnlineRewardRecord> onlineRewardRepository,
        IRepository<LotteryRecord> lotteryRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _saveSnapshotRepository = saveSnapshotRepository;
        _equipmentRepository = equipmentRepository;
        _itemStackRepository = itemStackRepository;
        _playerSkillRepository = playerSkillRepository;
        _talentRepository = talentRepository;
        _codexRepository = codexRepository;
        _achievementRepository = achievementRepository;
        _mailRepository = mailRepository;
        _checkInRepository = checkInRepository;
        _onlineRewardRepository = onlineRewardRepository;
        _lotteryRepository = lotteryRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 保存玩家游戏存档为 JSON 快照（不存在则创建，已存在则更新版本号与保存时间）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">存档内容（JSON 数据、版本号）</param>
    /// <returns>保存结果输出（成功/失败、保存时间、消息）</returns>
    public async Task<SaveGameOutput?> SaveGameAsync(string playerId, SaveGameInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var snapshot = await _context.SaveDataSnapshots
            .FirstOrDefaultAsync(s => s.PlayerId == playerId && !s.IsDeleted);

        var savedAt = DateTimeOffset.UtcNow;

        if (snapshot != null)
        {
            snapshot.SaveDataJson = input.SaveData;
            snapshot.Version = input.Version;
            snapshot.SavedAt = savedAt;
            await _saveSnapshotRepository.UpdateAsync(snapshot);
        }
        else
        {
            await _saveSnapshotRepository.AddAsync(new SaveDataSnapshot
            {
                PlayerId = playerId,
                SaveDataJson = input.SaveData,
                Version = input.Version,
                SavedAt = savedAt
            });
        }

        return new SaveGameOutput
        {
            Success = true,
            SavedAt = savedAt,
            Message = "存档成功"
        };
    }

    /// <summary>
    /// 读取玩家存档 JSON 快照（含版本号与保存时间）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>存档读取输出（存档 JSON、版本、保存时间），玩家不存在或无存档返回 null</returns>
    public async Task<LoadGameOutput?> LoadGameAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var snapshot = await _context.SaveDataSnapshots
            .FirstOrDefaultAsync(s => s.PlayerId == playerId && !s.IsDeleted);

        if (snapshot == null)
        {
            return new LoadGameOutput
            {
                HasSave = false,
                SaveData = null,
                Version = null,
                SavedAt = null,
                Message = "暂无存档"
            };
        }

        return new LoadGameOutput
        {
            HasSave = true,
            SaveData = snapshot.SaveDataJson,
            Version = snapshot.Version,
            SavedAt = snapshot.SavedAt,
            Message = "读取存档成功"
        };
    }

    /// <summary>
    /// 聚合玩家所有数据表（玩家资料、装备、背包、技能、天赋、图鉴、成就、邮件、签到、在线奖励、抽奖）返回完整结构化存档
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>玩家完整存档输出对象，玩家不存在返回 null</returns>
    public async Task<FullSaveDataOutput?> GetFullSaveDataAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipments = await _context.Equipments
            .Where(e => e.PlayerId == playerId && !e.IsDeleted)
            .ToListAsync();

        var equipped = equipments.Where(e => e.IsEquipped).ToList();
        var storage = equipments.Where(e => !e.IsEquipped).ToList();

        var inventory = await _context.Inventory
            .Where(i => i.PlayerId == playerId && !i.IsDeleted)
            .ToListAsync();

        var skills = await _context.PlayerSkills
            .Where(s => s.PlayerId == playerId && !s.IsDeleted)
            .ToListAsync();

        var talents = await _context.Talents
            .Where(t => t.PlayerId == playerId && !t.IsDeleted)
            .ToListAsync();

        var codexEntries = await _context.CodexEntries
            .Where(c => c.PlayerId == playerId && !c.IsDeleted)
            .ToListAsync();

        var achievements = await _context.Achievements
            .Where(a => a.PlayerId == playerId && !a.IsDeleted)
            .ToListAsync();

        var mails = await _context.Mails
            .Where(m => m.PlayerId == playerId && !m.IsDeleted)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();

        var checkInRecord = await _context.CheckInRecords
            .Where(c => c.PlayerId == playerId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        var onlineRewardRecord = await _context.OnlineRewardRecords
            .FirstOrDefaultAsync(o => o.PlayerId == playerId && !o.IsDeleted);

        var lotteryRecord = await _context.LotteryRecords
            .FirstOrDefaultAsync(l => l.PlayerId == playerId && !l.IsDeleted);

        var highestWave = await _context.BattleRecords
            .Where(b => b.PlayerId == playerId && !b.IsDeleted)
            .MaxAsync(b => (int?)b.Wave) ?? 0;

        var checkInDays = new List<int>();
        if (!string.IsNullOrWhiteSpace(checkInRecord?.CheckInDays))
        {
            checkInDays = checkInRecord.CheckInDays
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s, out var v) ? v : -1)
                .Where(v => v >= 0)
                .Distinct()
                .OrderBy(v => v)
                .ToList();
        }

        var savedAt = DateTimeOffset.UtcNow;
        var snapshot = await _context.SaveDataSnapshots
            .FirstOrDefaultAsync(s => s.PlayerId == playerId && !s.IsDeleted);
        if (snapshot != null)
        {
            savedAt = snapshot.SavedAt;
        }

        return new FullSaveDataOutput
        {
            Player = new PlayerSaveData
            {
                Level = player.Level,
                Exp = player.Exp,
                ExpToNextLevel = player.ExpToNextLevel,
                Gold = player.Gold,
                Score = player.Score,
                SkillPoints = player.SkillPoints,
                MaxWave = player.MaxWave,
                TotalKills = player.TotalKills,
                TotalBattles = player.TotalBattles,
                TotalVictories = player.TotalVictories
            },
            GameState = new GameStateSaveData
            {
                CurrentWave = 0
            },
            Equipment = _mapper.Map<List<Core.DTOs.Equipment.EquipmentOutput>>(equipped),
            EquipmentStorage = _mapper.Map<List<Core.DTOs.Equipment.EquipmentOutput>>(storage),
            Inventory = inventory.Select(i => new Core.DTOs.Inventory.ItemStackOutput
            {
                ItemId = i.ItemId,
                Count = i.Count,
                Name = GetItemName(i.ItemId),
                Rarity = GetItemRarity(i.ItemId),
                Type = GetItemType(i.ItemId)
            }).ToList(),
            Skills = skills.Select(s => new SkillSaveData
            {
                SkillId = s.SkillId,
                Level = s.Level
            }).ToList(),
            Talents = _mapper.Map<List<Core.DTOs.Talent.TalentOutput>>(talents),
            CodexEntries = _mapper.Map<List<Core.DTOs.Codex.CodexEntryOutput>>(codexEntries),
            Achievements = _mapper.Map<List<Core.DTOs.Achievement.AchievementOutput>>(achievements),
            Mails = _mapper.Map<List<Core.DTOs.Mail.MailOutput>>(mails),
            HighestWave = highestWave,
            CheckIn = new CheckInSaveData
            {
                CheckInDays = checkInDays,
                WeekKey = checkInRecord?.WeekKey ?? string.Empty,
                ConsecutiveDays = checkInRecord?.ConsecutiveDays ?? 0
            },
            OnlineRewards = new OnlineRewardSaveData
            {
                OnlineMinutes = onlineRewardRecord?.OnlineMinutes ?? 0,
                ClaimedLevel = onlineRewardRecord?.ClaimedLevel ?? 0
            },
            Lottery = new LotterySaveData
            {
                LotteryCoins = lotteryRecord?.LotteryCoins ?? 0,
                BetsJson = lotteryRecord?.BetsJson,
                ConsecutiveLoginDays = lotteryRecord?.ConsecutiveLoginDays ?? 0,
                FreeSpins = lotteryRecord?.FreeSpins ?? 0,
                LuckyMissCounter = lotteryRecord?.LuckyMissCounter ?? 0
            },
            SavedAt = savedAt,
            Version = snapshot?.Version ?? 1
        };
    }

    /// <summary>
    /// 重置玩家存档：清空玩家装备、背包、技能、天赋、图鉴、成就、邮件、签到、在线奖励、抽奖等全部数据
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>重置结果输出（成功/失败、消息）</returns>
    public async Task<ResetSaveOutput?> ResetSaveAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipments = await _context.Equipments
            .Where(e => e.PlayerId == playerId && !e.IsDeleted)
            .ToListAsync();
        foreach (var e in equipments)
        {
            e.IsDeleted = true;
            e.DeletedAt = DateTimeOffset.UtcNow;
            _context.Equipments.Update(e);
        }

        var itemStacks = await _context.Inventory
            .Where(i => i.PlayerId == playerId && !i.IsDeleted)
            .ToListAsync();
        foreach (var i in itemStacks)
        {
            i.IsDeleted = true;
            i.DeletedAt = DateTimeOffset.UtcNow;
            _context.Inventory.Update(i);
        }

        var skills = await _context.PlayerSkills
            .Where(s => s.PlayerId == playerId && !s.IsDeleted)
            .ToListAsync();
        foreach (var s in skills)
        {
            s.IsDeleted = true;
            s.DeletedAt = DateTimeOffset.UtcNow;
            _context.PlayerSkills.Update(s);
        }

        var talents = await _context.Talents
            .Where(t => t.PlayerId == playerId && !t.IsDeleted)
            .ToListAsync();
        foreach (var t in talents)
        {
            t.IsDeleted = true;
            t.DeletedAt = DateTimeOffset.UtcNow;
            _context.Talents.Update(t);
        }

        var codexEntries = await _context.CodexEntries
            .Where(c => c.PlayerId == playerId && !c.IsDeleted)
            .ToListAsync();
        foreach (var c in codexEntries)
        {
            c.IsDeleted = true;
            c.DeletedAt = DateTimeOffset.UtcNow;
            _context.CodexEntries.Update(c);
        }

        var achievements = await _context.Achievements
            .Where(a => a.PlayerId == playerId && !a.IsDeleted)
            .ToListAsync();
        foreach (var a in achievements)
        {
            a.IsDeleted = true;
            a.DeletedAt = DateTimeOffset.UtcNow;
            _context.Achievements.Update(a);
        }

        var mails = await _context.Mails
            .Where(m => m.PlayerId == playerId && !m.IsDeleted)
            .ToListAsync();
        foreach (var m in mails)
        {
            m.IsDeleted = true;
            m.DeletedAt = DateTimeOffset.UtcNow;
            _context.Mails.Update(m);
        }

        var checkInRecords = await _context.CheckInRecords
            .Where(c => c.PlayerId == playerId && !c.IsDeleted)
            .ToListAsync();
        foreach (var c in checkInRecords)
        {
            c.IsDeleted = true;
            c.DeletedAt = DateTimeOffset.UtcNow;
            _context.CheckInRecords.Update(c);
        }

        var onlineRewardRecords = await _context.OnlineRewardRecords
            .Where(o => o.PlayerId == playerId && !o.IsDeleted)
            .ToListAsync();
        foreach (var o in onlineRewardRecords)
        {
            o.IsDeleted = true;
            o.DeletedAt = DateTimeOffset.UtcNow;
            _context.OnlineRewardRecords.Update(o);
        }

        var lotteryRecords = await _context.LotteryRecords
            .Where(l => l.PlayerId == playerId && !l.IsDeleted)
            .ToListAsync();
        foreach (var l in lotteryRecords)
        {
            l.IsDeleted = true;
            l.DeletedAt = DateTimeOffset.UtcNow;
            _context.LotteryRecords.Update(l);
        }

        var battleRecords = await _context.BattleRecords
            .Where(b => b.PlayerId == playerId && !b.IsDeleted)
            .ToListAsync();
        foreach (var b in battleRecords)
        {
            b.IsDeleted = true;
            b.DeletedAt = DateTimeOffset.UtcNow;
            _context.BattleRecords.Update(b);
        }

        var quizAttempts = await _context.QuizAttempts
            .Where(q => q.PlayerId == playerId && !q.IsDeleted)
            .ToListAsync();
        foreach (var q in quizAttempts)
        {
            q.IsDeleted = true;
            q.DeletedAt = DateTimeOffset.UtcNow;
            _context.QuizAttempts.Update(q);
        }

        var snapshots = await _context.SaveDataSnapshots
            .Where(s => s.PlayerId == playerId && !s.IsDeleted)
            .ToListAsync();
        foreach (var s in snapshots)
        {
            s.IsDeleted = true;
            s.DeletedAt = DateTimeOffset.UtcNow;
            _context.SaveDataSnapshots.Update(s);
        }

        player.Level = 1;
        player.Exp = 0;
        player.ExpToNextLevel = 100;
        player.Gold = 0;
        player.Score = 0;
        player.SkillPoints = 0;
        player.MaxWave = 0;
        player.TotalKills = 0;
        player.TotalBattles = 0;
        player.TotalVictories = 0;
        player.LastActiveAt = DateTimeOffset.UtcNow;

        await _playerRepository.UpdateAsync(player);
        await _context.SaveChangesAsync();

        return new ResetSaveOutput
        {
            Success = true,
            Message = "存档已重置"
        };
    }

    private static string GetItemName(string itemId)
    {
        return itemId switch
        {
            "potion_full" => "完全恢复药水",
            "potion_hp" => "普通血瓶",
            "health_potion" => "生命药水",
            "health_potion_fine" => "精良生命药水",
            "attack_boost" => "攻击增益药剂",
            "bomb" => "炸弹",
            "grenade" => "手榴弹",
            _ => itemId
        };
    }

    private static Core.Enums.EquipRarity GetItemRarity(string itemId)
    {
        if (itemId.Contains("_mythic", StringComparison.OrdinalIgnoreCase))
            return Core.Enums.EquipRarity.Mythic;
        if (itemId.Contains("_epic", StringComparison.OrdinalIgnoreCase))
            return Core.Enums.EquipRarity.Epic;
        if (itemId.Contains("_legendary", StringComparison.OrdinalIgnoreCase))
            return Core.Enums.EquipRarity.Legendary;
        if (itemId.Contains("_fine", StringComparison.OrdinalIgnoreCase))
            return Core.Enums.EquipRarity.Fine;
        if (itemId.Contains("_advanced", StringComparison.OrdinalIgnoreCase))
            return Core.Enums.EquipRarity.Advanced;
        return Core.Enums.EquipRarity.Common;
    }

    private static string GetItemType(string itemId)
    {
        if (itemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase))
            return "Gem";
        if (itemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase))
            return "Enchant";
        if (itemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase))
            return "Enhance";
        if (itemId.StartsWith("potion_", StringComparison.OrdinalIgnoreCase) || itemId.Contains("potion", StringComparison.OrdinalIgnoreCase))
            return "Potion";
        return "Item";
    }
}
