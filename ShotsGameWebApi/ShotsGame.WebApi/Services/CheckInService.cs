using System.Globalization;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.CheckIn;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 签到系统服务：查询签到状态、查询每周奖励配置、执行每日签到领取奖励
/// </summary>
public class CheckInService : ICheckInService
{
    private static readonly CheckInDayReward[] WeekRewards = new[]
    {
        new CheckInDayReward { DayIndex = 0, Gold = 100, ItemId = "potion_hp", ItemCount = 2, Name = "普通血瓶 x2" },
        new CheckInDayReward { DayIndex = 1, Gold = 150, ItemId = "enhance_stone_common", ItemCount = 2, Name = "普通强化石 x2" },
        new CheckInDayReward { DayIndex = 2, Gold = 200, ItemId = "gem_red_fine", ItemCount = 1, Name = "精良红宝石 x1" },
        new CheckInDayReward { DayIndex = 3, Gold = 250, ItemId = "grenade", ItemCount = 3, Name = "手榴弹 x3" },
        new CheckInDayReward { DayIndex = 4, Gold = 300, ItemId = "enchant_book_advanced", ItemCount = 1, Name = "高级附魔书 x1" },
        new CheckInDayReward { DayIndex = 5, Gold = 500, ItemId = "enhance_stone_fine", ItemCount = 3, Name = "精良强化石 x3" },
        new CheckInDayReward { DayIndex = 6, Gold = 1000, ItemId = "gem_blue_legendary", ItemCount = 1, Name = "传奇蓝宝石 x1" }
    };

    private const int InventoryCapacity = 100;
    private const int GemCapacity = 50;
    private const int EnhanceCapacity = 30;
    private const int EnchantCapacity = 30;

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<CheckInRecord> _checkInRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public CheckInService(
        IPlayerRepository playerRepository,
        IRepository<CheckInRecord> checkInRepository,
        IRepository<ItemStack> itemStackRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _checkInRepository = checkInRepository;
        _itemStackRepository = itemStackRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 获取玩家签到状态（本周已签到天数、今日是否已签到、连续签到次数、本周奖励配置）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>签到状态输出，玩家不存在返回 null</returns>
    public async Task<CheckInOutput?> GetCheckInStatusAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var weekKey = GetWeekKey(DateTimeOffset.UtcNow);
        var record = await GetOrCreateRecordAsync(playerId, weekKey);
        var checkedDays = ParseCheckedDays(record.CheckInDays);
        var todayIndex = GetMondayBasedDayOfWeek(DateTimeOffset.UtcNow);
        var todayReward = WeekRewards[todayIndex];

        var canCheckIn = !checkedDays.Contains(todayIndex);

        return new CheckInOutput
        {
            WeekKey = weekKey,
            CheckedDays = checkedDays,
            TodayDayOfWeek = todayIndex,
            CanCheckIn = canCheckIn,
            ConsecutiveDays = record.ConsecutiveDays,
            TodayReward = new CheckInRewardOutput
            {
                DayIndex = todayIndex,
                ItemId = todayReward.ItemId,
                ItemCount = todayReward.ItemCount,
                Gold = todayReward.Gold,
                Name = todayReward.Name,
                Icon = GetItemIcon(todayReward.ItemId)
            }
        };
    }

    /// <summary>
    /// 获取本周签到奖励配置（7 天的金币、道具、宝石等奖励列表）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>本周奖励输出（7 天奖励配置、今日推荐），玩家不存在返回 null</returns>
    public async Task<WeekRewardsOutput?> GetWeekRewardsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var weekKey = GetWeekKey(DateTimeOffset.UtcNow);
        var record = await GetOrCreateRecordAsync(playerId, weekKey);
        var checkedDays = ParseCheckedDays(record.CheckInDays);

        var rewards = WeekRewards.Select(r => new CheckInRewardOutput
        {
            DayIndex = r.DayIndex,
            ItemId = r.ItemId,
            ItemCount = r.ItemCount,
            Gold = r.Gold,
            Name = r.Name,
            Icon = GetItemIcon(r.ItemId)
        }).ToList();

        return new WeekRewardsOutput
        {
            WeekKey = weekKey,
            Rewards = rewards,
            CheckedDays = checkedDays
        };
    }

    /// <summary>
    /// 执行今日签到：校验今日未签到，发放当日金币和道具奖励并记录签到状态（连续签到奖励额外加成）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>签到结果输出（成功/失败、今日奖励、消息），玩家不存在或今日已签到返回 null</returns>
    public async Task<DoCheckInOutput?> DoCheckInAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var today = DateTimeOffset.UtcNow;
        var weekKey = GetWeekKey(today);
        var todayIndex = GetMondayBasedDayOfWeek(today);
        var record = await GetOrCreateRecordAsync(playerId, weekKey);
        var checkedDays = ParseCheckedDays(record.CheckInDays);

        if (checkedDays.Contains(todayIndex))
        {
            return new DoCheckInOutput
            {
                Success = false,
                Message = "今日已签到"
            };
        }

        var todayReward = WeekRewards[todayIndex];
        var resultItems = new List<ItemStackOutput>();

        if (todayReward.Gold > 0)
        {
            player.Gold += todayReward.Gold;
        }

        if (!string.IsNullOrEmpty(todayReward.ItemId) && todayReward.ItemCount > 0)
        {
            var capacityOk = await CheckItemCapacity(playerId, todayReward.ItemId);
            if (capacityOk)
            {
                await AddOrMergeItemStack(playerId, todayReward.ItemId, todayReward.ItemCount);
                resultItems.Add(new ItemStackOutput
                {
                    ItemId = todayReward.ItemId,
                    Count = todayReward.ItemCount,
                    Name = todayReward.Name,
                    Rarity = GetItemRarity(todayReward.ItemId),
                    Type = GetItemType(todayReward.ItemId)
                });
            }
        }

        checkedDays.Add(todayIndex);
        record.CheckInDays = string.Join(",", checkedDays.OrderBy(d => d));

        if (record.LastCheckInDate.HasValue)
        {
            var lastCheckIn = record.LastCheckInDate.Value.Date;
            var yesterday = today.Date.AddDays(-1);
            if (lastCheckIn == yesterday)
            {
                record.ConsecutiveDays++;
            }
            else if (lastCheckIn != today.Date)
            {
                record.ConsecutiveDays = 1;
            }
        }
        else
        {
            record.ConsecutiveDays = 1;
        }

        record.LastCheckInDate = today.Date;

        await _checkInRepository.UpdateAsync(record);
        await _playerRepository.UpdateAsync(player);
        await _context.SaveChangesAsync();

        return new DoCheckInOutput
        {
            Success = true,
            DayIndex = todayIndex,
            Gold = todayReward.Gold,
            Items = resultItems,
            Message = "签到成功"
        };
    }

    private async Task<CheckInRecord> GetOrCreateRecordAsync(string playerId, string weekKey)
    {
        var existing = await _context.CheckInRecords
            .FirstOrDefaultAsync(r => r.PlayerId == playerId && r.WeekKey == weekKey && !r.IsDeleted);

        if (existing != null)
        {
            return existing;
        }

        var newRecord = new CheckInRecord
        {
            PlayerId = playerId,
            WeekKey = weekKey,
            CheckInDays = string.Empty,
            LastCheckInDate = null,
            ConsecutiveDays = 0
        };
        await _checkInRepository.AddAsync(newRecord);
        return newRecord;
    }

    private static string GetWeekKey(DateTimeOffset date)
    {
        var dt = date.DateTime;
        var cal = CultureInfo.InvariantCulture.Calendar;
        var week = cal.GetWeekOfYear(dt, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        var year = date.Year;

        if (week == 1 && date.Month == 12)
        {
            year++;
        }
        else if (week >= 52 && date.Month == 1)
        {
            year--;
        }

        return $"{year}-W{week:D2}";
    }

    private static int GetMondayBasedDayOfWeek(DateTimeOffset date)
    {
        var dow = (int)date.DayOfWeek;
        return dow == 0 ? 6 : dow - 1;
    }

    private static List<int> ParseCheckedDays(string checkInDays)
    {
        if (string.IsNullOrWhiteSpace(checkInDays))
        {
            return new List<int>();
        }

        return checkInDays.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => int.TryParse(s, out var v) ? v : -1)
            .Where(v => v >= 0 && v < 7)
            .Distinct()
            .OrderBy(v => v)
            .ToList();
    }

    private async Task<bool> CheckItemCapacity(string playerId, string itemId)
    {
        var existing = await _context.Inventory
            .AnyAsync(i => i.PlayerId == playerId && i.ItemId == itemId && !i.IsDeleted);

        if (existing)
        {
            return true;
        }

        var allItems = await _context.Inventory
            .Where(i => i.PlayerId == playerId && !i.IsDeleted)
            .ToListAsync();

        if (itemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase))
        {
            return allItems.Count(i => i.ItemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase)) < GemCapacity;
        }
        if (itemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase))
        {
            return allItems.Count(i => i.ItemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase)) < EnchantCapacity;
        }
        if (itemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase))
        {
            return allItems.Count(i => i.ItemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase)) < EnhanceCapacity;
        }

        var invCount = allItems.Count(i =>
            !i.ItemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase) &&
            !i.ItemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase) &&
            !i.ItemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase));
        return invCount < InventoryCapacity;
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

    private static string? GetItemIcon(string? itemId)
    {
        return null;
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

    private class CheckInDayReward
    {
        public int DayIndex { get; set; }
        public long Gold { get; set; }
        public string? ItemId { get; set; }
        public int ItemCount { get; set; }
        public string? Name { get; set; }
    }
}
