using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.DTOs.LotteryPot;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 抽奖罐服务：使用抽奖罐道具进行加权随机抽奖，奖励包含金币、经验、道具、宝石等
/// </summary>
public class LotteryPotService : ILotteryPotService
{
    private const string LotteryPotItemId = "lottery_pot";

    private static readonly Random _rng = new();

    private static readonly List<PotRewardConfig> RewardConfigs = new()
    {
        new PotRewardConfig { Type = "gold", Weight = 28, GoldMin = 500, GoldMax = 2000, Name = "金币(小)" },
        new PotRewardConfig { Type = "gold", Weight = 12, GoldMin = 2000, GoldMax = 5000, Name = "金币(大)" },
        new PotRewardConfig { Type = "exp", Weight = 15, ExpAmount = 200, Name = "小型经验书" },
        new PotRewardConfig { Type = "exp", Weight = 8, ExpAmount = 1000, Name = "中型经验书" },
        new PotRewardConfig { Type = "exp", Weight = 3, ExpAmount = 5000, Name = "大型经验书" },
        new PotRewardConfig { Type = "item", Weight = 12, ItemId = "potion_hp", ItemCount = 3, Name = "生命药水" },
        new PotRewardConfig { Type = "item", Weight = 8, ItemId = "potion_attack", ItemCount = 2, Name = "攻击药剂" },
        new PotRewardConfig { Type = "item", Weight = 6, ItemId = "potion_speed", ItemCount = 2, Name = "速度药剂" },
        new PotRewardConfig { Type = "item", Weight = 4, ItemId = "grenade", ItemCount = 2, Name = "炸弹" },
        new PotRewardConfig { Type = "item", Weight = 2, ItemId = "enhance_scroll_plus1", ItemCount = 3, Name = "强化+1卷" },
        new PotRewardConfig { Type = "item", Weight = 1, ItemId = "gem_attack_advanced", ItemCount = 2, Name = "攻击宝石(进阶)" },
        new PotRewardConfig { Type = "item", Weight = 1, ItemId = "gem_health_advanced", ItemCount = 2, Name = "生命宝石(进阶)" }
    };

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<LotteryPotRecord> _lotteryPotRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public LotteryPotService(
        IPlayerRepository playerRepository,
        IRepository<LotteryPotRecord> lotteryPotRepository,
        IRepository<ItemStack> itemStackRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _lotteryPotRepository = lotteryPotRepository;
        _itemStackRepository = itemStackRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 获取玩家抽奖罐状态（累计使用次数、最近使用时间、当前背包可用抽奖罐数量）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>抽奖罐状态输出，玩家不存在返回 null</returns>
    public async Task<LotteryPotOutput?> GetStatusAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateLotteryPotRecordAsync(playerId);

        var availablePotCount = await _context.Inventory
            .Where(i => i.PlayerId == playerId && i.ItemId == LotteryPotItemId && !i.IsDeleted)
            .SumAsync(i => i.Count);

        return new LotteryPotOutput
        {
            TotalUsed = record.TotalUsed,
            LastUsedAt = record.LastUsedAt,
            AvailablePotCount = availablePotCount
        };
    }

    /// <summary>
    /// 使用抽奖罐进行抽奖：扣除指定数量抽奖罐道具，按加权概率抽取奖励并发放（金币、经验、道具、宝石）并返回奖励列表
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">抽奖参数（抽奖罐使用数量）</param>
    /// <returns>抽奖结果输出（成功/失败、消耗数量、奖励列表、消息），玩家不存在或抽奖罐数量不足返回 null</returns>
    public async Task<UseLotteryPotOutput?> UsePotAsync(string playerId, UseLotteryPotInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (input.Count <= 0)
        {
            return null;
        }

        var record = await GetOrCreateLotteryPotRecordAsync(playerId);

        var potStack = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == LotteryPotItemId && !i.IsDeleted);

        var availablePotCount = potStack?.Count ?? 0;
        if (availablePotCount < input.Count)
        {
            return null;
        }

        if (potStack != null)
        {
            potStack.Count -= input.Count;
            if (potStack.Count <= 0)
            {
                await _itemStackRepository.DeleteAsync(potStack.Id);
            }
            else
            {
                await _itemStackRepository.UpdateAsync(potStack);
            }
        }

        var rewards = new List<LotteryPotReward>();
        var itemsAwarded = new List<ItemStackOutput>();
        long totalGold = 0;
        long totalExp = 0;

        var itemRewardGroups = new Dictionary<string, int>();

        for (int i = 0; i < input.Count; i++)
        {
            var reward = PickWeightedReward();
            var rewardEntry = new LotteryPotReward
            {
                Type = reward.Type,
                Name = reward.Name
            };

            switch (reward.Type)
            {
                case "gold":
                    var goldAmount = _rng.Next(reward.GoldMin!.Value, reward.GoldMax!.Value + 1);
                    rewardEntry.Gold = goldAmount;
                    totalGold += goldAmount;
                    player.Gold += goldAmount;
                    break;

                case "exp":
                    var expAmount = reward.ExpAmount!.Value;
                    rewardEntry.Exp = expAmount;
                    totalExp += expAmount;
                    player.Exp += expAmount;
                    await ProcessLevelUpAsync(player);
                    break;

                case "item":
                    rewardEntry.ItemId = reward.ItemId;
                    rewardEntry.ItemCount = reward.ItemCount;
                    if (!string.IsNullOrEmpty(reward.ItemId) && reward.ItemCount > 0)
                    {
                        itemRewardGroups.TryGetValue(reward.ItemId, out var current);
                        itemRewardGroups[reward.ItemId] = current + reward.ItemCount.Value;
                    }
                    break;
            }

            rewards.Add(rewardEntry);
        }

        foreach (var kvp in itemRewardGroups)
        {
            var itemOutput = await AddItemToInventoryAsync(playerId, kvp.Key, kvp.Value);
            if (itemOutput != null)
            {
                itemsAwarded.Add(itemOutput);
            }
        }

        record.TotalUsed += input.Count;
        record.LastUsedAt = DateTimeOffset.UtcNow;

        await _lotteryPotRepository.UpdateAsync(record);
        await _playerRepository.UpdateAsync(player);
        await _context.SaveChangesAsync();

        var remainingPots = (potStack?.Count ?? 0);

        return new UseLotteryPotOutput
        {
            Rewards = rewards,
            TotalGold = totalGold,
            TotalExp = totalExp,
            ItemsAwarded = itemsAwarded,
            UseCount = input.Count,
            RemainingPots = remainingPots
        };
    }

    private async Task<LotteryPotRecord> GetOrCreateLotteryPotRecordAsync(string playerId)
    {
        var record = await _context.LotteryPotRecords
            .FirstOrDefaultAsync(r => r.PlayerId == playerId && !r.IsDeleted);

        if (record == null)
        {
            record = new LotteryPotRecord
            {
                PlayerId = playerId,
                TotalUsed = 0,
                LastUsedAt = null
            };
            await _lotteryPotRepository.AddAsync(record);
        }

        return record;
    }

    private static PotRewardConfig PickWeightedReward()
    {
        var totalWeight = RewardConfigs.Sum(c => c.Weight);
        var roll = _rng.Next(0, totalWeight);
        var cumulative = 0;

        foreach (var config in RewardConfigs)
        {
            cumulative += config.Weight;
            if (roll < cumulative)
            {
                return config;
            }
        }

        return RewardConfigs[0];
    }

    private static async Task ProcessLevelUpAsync(Player player)
    {
        while (true)
        {
            var expToNext = CalculateExpToNextLevel(player.Level);
            if (player.Exp < expToNext)
            {
                break;
            }

            player.Exp -= expToNext;
            player.Level++;
            player.ExpToNextLevel = CalculateExpToNextLevel(player.Level);
            player.SkillPoints++;
        }

        await Task.CompletedTask;
    }

    private static long CalculateExpToNextLevel(int level)
    {
        return (long)Math.Floor(80 + Math.Pow(level, 2.05) * 3.5 + level * 6);
    }

    private async Task<ItemStackOutput?> AddItemToInventoryAsync(string playerId, string itemId, int count)
    {
        if (count <= 0)
        {
            return null;
        }

        var existing = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == itemId && !i.IsDeleted);

        if (existing != null)
        {
            existing.Count += count;
            existing.ModifiedAt = DateTimeOffset.UtcNow;
            _context.Inventory.Update(existing);
            return MapToItemStackOutput(existing);
        }

        var newStack = new ItemStack
        {
            PlayerId = playerId,
            ItemId = itemId,
            Count = count
        };
        await _itemStackRepository.AddAsync(newStack);

        return MapToItemStackOutput(newStack);
    }

    private static ItemStackOutput MapToItemStackOutput(ItemStack item)
    {
        return new ItemStackOutput
        {
            ItemId = item.ItemId,
            Count = item.Count,
            Name = GetItemName(item.ItemId),
            Icon = null,
            Description = null,
            Rarity = GetItemRarity(item.ItemId),
            Type = GetItemType(item.ItemId)
        };
    }

    private static string GetItemName(string itemId)
    {
        return itemId switch
        {
            "potion_hp" => "生命药水",
            "potion_attack" => "攻击药剂",
            "potion_speed" => "速度药剂",
            "grenade" => "炸弹",
            "enhance_scroll_plus1" => "强化+1卷",
            "gem_attack_advanced" => "攻击宝石(进阶)",
            "gem_health_advanced" => "生命宝石(进阶)",
            _ => itemId
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

    private class PotRewardConfig
    {
        public string Type { get; set; } = string.Empty;
        public int Weight { get; set; }
        public int? GoldMin { get; set; }
        public int? GoldMax { get; set; }
        public long? ExpAmount { get; set; }
        public string? ItemId { get; set; }
        public int? ItemCount { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
