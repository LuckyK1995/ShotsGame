using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.DTOs.OnlineReward;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 在线时长奖励服务：记录玩家累计在线时间，按 30/60/90/120 分钟 4 档领取金币和道具奖励
/// </summary>
public class OnlineRewardService : IOnlineRewardService
{
    private static readonly RewardTierConfig[] TierConfigs = new[]
    {
        new RewardTierConfig
        {
            Tier = 1,
            RequiredMinutes = 30,
            ItemId = "health_potion",
            ItemCount = 5,
            Gold = 300,
            Name = "生命药水 x5",
            Icon = null
        },
        new RewardTierConfig
        {
            Tier = 2,
            RequiredMinutes = 60,
            ItemId = "attack_boost",
            ItemCount = 3,
            Gold = 500,
            Name = "攻击增益药剂 x3",
            Icon = null
        },
        new RewardTierConfig
        {
            Tier = 3,
            RequiredMinutes = 90,
            ItemId = "bomb",
            ItemCount = 3,
            Gold = 800,
            Name = "炸弹 x3",
            Icon = null
        },
        new RewardTierConfig
        {
            Tier = 4,
            RequiredMinutes = 120,
            ItemId = "health_potion_fine",
            ItemCount = 5,
            Gold = 1500,
            Name = "精良生命药水 x5",
            Icon = null
        }
    };

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<OnlineRewardRecord> _onlineRewardRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public OnlineRewardService(
        IPlayerRepository playerRepository,
        IRepository<OnlineRewardRecord> onlineRewardRepository,
        IRepository<ItemStack> itemStackRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _onlineRewardRepository = onlineRewardRepository;
        _itemStackRepository = itemStackRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 获取玩家在线奖励状态：更新累计在线时长，返回各档位领取状态与奖励内容
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="currentOnlineMinutes">当前在线分钟数（大于记录值时会更新）</param>
    /// <returns>在线奖励状态输出（累计分钟、已领取档位、4档奖励详情），玩家不存在返回 null</returns>
    public async Task<OnlineRewardOutput?> GetStatusAsync(string playerId, int currentOnlineMinutes)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateRecordAsync(playerId);

        if (currentOnlineMinutes > record.OnlineMinutes)
        {
            record.OnlineMinutes = currentOnlineMinutes;
            await _onlineRewardRepository.UpdateAsync(record);
        }

        var onlineMinutes = record.OnlineMinutes;
        var claimedLevel = record.ClaimedLevel;

        var tiers = new List<RewardTierOutput>();
        RewardTierOutput? currentTierReward = null;

        foreach (var cfg in TierConfigs)
        {
            var tier = cfg.Tier;
            var claimed = tier <= claimedLevel;
            var canClaim = !claimed && onlineMinutes >= cfg.RequiredMinutes && tier == claimedLevel + 1;

            var output = new RewardTierOutput
            {
                Tier = tier,
                RequiredMinutes = cfg.RequiredMinutes,
                ItemId = cfg.ItemId,
                ItemCount = cfg.ItemCount,
                Gold = cfg.Gold,
                Name = cfg.Name,
                Icon = cfg.Icon,
                Claimed = claimed,
                CanClaim = canClaim
            };

            tiers.Add(output);

            if (canClaim && currentTierReward == null)
            {
                currentTierReward = output;
            }
        }

        var nextRewardMinutes = 0;
        for (var i = claimedLevel; i < TierConfigs.Length; i++)
        {
            var required = TierConfigs[i].RequiredMinutes;
            if (onlineMinutes < required)
            {
                nextRewardMinutes = required - onlineMinutes;
                break;
            }
        }

        return new OnlineRewardOutput
        {
            OnlineMinutes = onlineMinutes,
            ClaimedLevel = claimedLevel,
            NextRewardMinutes = nextRewardMinutes,
            CurrentTierReward = currentTierReward,
            Tiers = tiers
        };
    }

    /// <summary>
    /// 领取指定档位的在线奖励：校验在线时长与领取状态，发放金币和道具奖励并记录领取
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="tier">奖励档位（1-4）</param>
    /// <returns>领取结果输出（成功/失败、奖励内容、消息），玩家不存在或条件不满足返回 null</returns>
    public async Task<ClaimOnlineRewardOutput?> ClaimRewardAsync(string playerId, int tier)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (tier < 1 || tier > TierConfigs.Length)
        {
            return null;
        }

        var record = await GetOrCreateRecordAsync(playerId);
        var config = TierConfigs[tier - 1];

        if (record.OnlineMinutes < config.RequiredMinutes)
        {
            return new ClaimOnlineRewardOutput
            {
                Tier = tier,
                Gold = 0,
                Items = new List<ItemStackOutput>(),
                NewClaimedLevel = record.ClaimedLevel,
                Message = $"在线时长不足，需累计{config.RequiredMinutes}分钟"
            };
        }

        if (tier != record.ClaimedLevel + 1)
        {
            return new ClaimOnlineRewardOutput
            {
                Tier = tier,
                Gold = 0,
                Items = new List<ItemStackOutput>(),
                NewClaimedLevel = record.ClaimedLevel,
                Message = "请按顺序领取奖励"
            };
        }

        if (tier <= record.ClaimedLevel)
        {
            return new ClaimOnlineRewardOutput
            {
                Tier = tier,
                Gold = 0,
                Items = new List<ItemStackOutput>(),
                NewClaimedLevel = record.ClaimedLevel,
                Message = "该档奖励已领取"
            };
        }

        var resultItems = new List<ItemStackOutput>();

        if (config.Gold > 0)
        {
            player.Gold += config.Gold;
        }

        if (!string.IsNullOrEmpty(config.ItemId) && config.ItemCount > 0)
        {
            await AddOrMergeItemStack(playerId, config.ItemId, config.ItemCount);
            resultItems.Add(new ItemStackOutput
            {
                ItemId = config.ItemId,
                Count = config.ItemCount,
                Name = GetItemName(config.ItemId),
                Rarity = GetItemRarity(config.ItemId),
                Type = GetItemType(config.ItemId)
            });
        }

        record.ClaimedLevel = tier;
        record.LastResetDate = record.LastResetDate;

        await _onlineRewardRepository.UpdateAsync(record);
        await _playerRepository.UpdateAsync(player);
        await _context.SaveChangesAsync();

        return new ClaimOnlineRewardOutput
        {
            Tier = tier,
            Gold = config.Gold,
            Items = resultItems,
            NewClaimedLevel = record.ClaimedLevel,
            Message = $"领取成功：{config.Name} + {config.Gold}金币"
        };
    }

    private async Task<OnlineRewardRecord> GetOrCreateRecordAsync(string playerId)
    {
        var existing = await _context.OnlineRewardRecords
            .FirstOrDefaultAsync(r => r.PlayerId == playerId && !r.IsDeleted);

        if (existing != null)
        {
            var today = DateTimeOffset.UtcNow.Date;
            if (existing.LastResetDate.Date != today)
            {
                existing.OnlineMinutes = 0;
                existing.ClaimedLevel = 0;
                existing.LastResetDate = today;
                await _onlineRewardRepository.UpdateAsync(existing);
            }
            return existing;
        }

        var newRecord = new OnlineRewardRecord
        {
            PlayerId = playerId,
            OnlineMinutes = 0,
            ClaimedLevel = 0,
            LastResetDate = DateTimeOffset.UtcNow.Date
        };
        await _onlineRewardRepository.AddAsync(newRecord);
        return newRecord;
    }

    private async Task AddOrMergeItemStack(string playerId, string itemId, int count)
    {
        if (count <= 0) return;

        var existing = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == itemId && !i.IsDeleted);

        if (existing != null)
        {
            existing.Count += count;
            existing.ModifiedAt = DateTimeOffset.UtcNow;
            _context.Inventory.Update(existing);
        }
        else
        {
            await _itemStackRepository.AddAsync(new ItemStack
            {
                PlayerId = playerId,
                ItemId = itemId,
                Count = count
            });
        }
    }

    private static string GetItemName(string itemId)
    {
        return itemId switch
        {
            "health_potion" => "生命药水",
            "health_potion_fine" => "精良生命药水",
            "attack_boost" => "攻击增益药剂",
            "bomb" => "炸弹",
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

    private class RewardTierConfig
    {
        public int Tier { get; set; }
        public int RequiredMinutes { get; set; }
        public string? ItemId { get; set; }
        public int ItemCount { get; set; }
        public long Gold { get; set; }
        public string? Name { get; set; }
        public string? Icon { get; set; }
    }
}
