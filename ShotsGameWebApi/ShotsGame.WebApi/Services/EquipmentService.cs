using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Enhance;
using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 装备系统服务：已装备列表、仓库查询、装备穿戴/卸下、随机生成装备、强化、附魔、宝石镶嵌、分解、强化等级转移
/// </summary>
public class EquipmentService : IEquipmentService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<Equipment> _equipmentRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;
    private static readonly Random _random = new();

    public EquipmentService(
        IPlayerRepository playerRepository,
        IRepository<Equipment> equipmentRepository,
        IRepository<ItemStack> itemStackRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _equipmentRepository = equipmentRepository;
        _itemStackRepository = itemStackRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 获取玩家已穿戴的装备列表（按装备槽位聚合返回）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>已装备装备输出列表，玩家不存在返回 null</returns>
    public async Task<List<EquipmentOutput>?> GetEquippedItemsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipments = await _context.Equipments
            .Where(e => e.PlayerId == playerId && e.IsEquipped && !e.IsDeleted)
            .ToListAsync();

        return _mapper.Map<List<EquipmentOutput>>(equipments);
    }

    /// <summary>
    /// 获取玩家装备仓库（未穿戴的装备，按创建时间倒序返回）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>装备仓库输出列表，玩家不存在返回 null</returns>
    public async Task<List<EquipmentOutput>?> GetEquipmentStorageAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipments = await _context.Equipments
            .Where(e => e.PlayerId == playerId && !e.IsEquipped && !e.IsDeleted)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<EquipmentOutput>>(equipments);
    }

    /// <summary>
    /// 获取玩家单个装备详情（按装备 ID 和玩家 ID 双重校验归属）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="equipmentId">装备 ID</param>
    /// <returns>装备详情输出，玩家不存在或装备不存在返回 null</returns>
    public async Task<EquipmentOutput?> GetEquipmentAsync(string playerId, string equipmentId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipment = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == equipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (equipment == null)
        {
            return null;
        }

        return _mapper.Map<EquipmentOutput>(equipment);
    }

    /// <summary>
    /// 穿戴装备：将指定装备设为已装备状态，同槽位的旧装备自动卸下
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">穿戴参数（装备 ID）</param>
    /// <returns>穿戴后装备输出，玩家不存在或装备不存在或槽位冲突返回 null</returns>
    public async Task<EquipmentOutput?> EquipItemAsync(string playerId, EquipItemInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipment = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == input.EquipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (equipment == null)
        {
            return null;
        }

        if (equipment.IsEquipped)
        {
            return _mapper.Map<EquipmentOutput>(equipment);
        }

        var slot = equipment.Slot;
        var oldEquipped = await _context.Equipments
            .FirstOrDefaultAsync(e => e.PlayerId == playerId && e.Slot == slot && e.IsEquipped && !e.IsDeleted && e.Id != equipment.Id);
        if (oldEquipped != null)
        {
            oldEquipped.IsEquipped = false;
            oldEquipped.ModifiedAt = DateTimeOffset.UtcNow;
            _context.Equipments.Update(oldEquipped);
        }

        equipment.IsEquipped = true;
        equipment.ModifiedAt = DateTimeOffset.UtcNow;
        _context.Equipments.Update(equipment);
        await _context.SaveChangesAsync();

        return _mapper.Map<EquipmentOutput>(equipment);
    }

    /// <summary>
    /// 卸下装备：将指定装备设为未装备状态（放回仓库）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">卸下参数（装备槽位）</param>
    /// <returns>卸下后装备输出，玩家不存在或装备不存在返回 null</returns>
    public async Task<EquipmentOutput?> UnequipItemAsync(string playerId, UnequipItemInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipment = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == input.EquipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (equipment == null)
        {
            return null;
        }

        equipment.IsEquipped = false;
        equipment.ModifiedAt = DateTimeOffset.UtcNow;
        await _equipmentRepository.UpdateAsync(equipment);

        return _mapper.Map<EquipmentOutput>(equipment);
    }

    /// <summary>
    /// 随机生成装备：按指定槽位、品质、玩家等级随机生成主属性、附加属性、词缀并保存到仓库
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">生成参数（装备槽位、装备品质、玩家等级）</param>
    /// <returns>新生成的装备输出，玩家不存在返回 null</returns>
    public async Task<EquipmentOutput?> GenerateEquipmentAsync(string playerId, GenerateEquipmentInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var slot = input.Slot ?? (EquipSlot)_random.Next(0, 9);
        var rarity = input.Rarity ?? (EquipRarity)_random.Next(0, 6);
        var level = Math.Max(1, input.Level);

        var rarityMultiplier = rarity switch
        {
            EquipRarity.Common => 1.0,
            EquipRarity.Advanced => 1.3,
            EquipRarity.Fine => 1.7,
            EquipRarity.Legendary => 2.2,
            EquipRarity.Epic => 2.8,
            EquipRarity.Mythic => 3.6,
            _ => 1.0
        };

        var baseValue = level * rarityMultiplier;

        var equipment = new Equipment
        {
            PlayerId = playerId,
            Name = $"{rarity} {slot} Lv.{level}",
            Slot = slot,
            Rarity = rarity,
            Level = level,
            EnhanceLevel = 0,
            Icon = $"icon_{slot}_{(int)rarity}",
            Description = $"Generated {rarity} {slot} at level {level}",
            IsEquipped = false,
            Durability = 100,
            MaxDurability = 100
        };

        switch (slot)
        {
            case EquipSlot.Weapon:
                equipment.Attack = (int)Math.Round(baseValue * (10 + _random.NextDouble() * 5));
                equipment.AttackSpeed = Math.Round(0.8 + _random.NextDouble() * 0.7, 2);
                equipment.CritRate = Math.Round(_random.NextDouble() * 0.15, 3);
                equipment.CritDamage = Math.Round(0.5 + _random.NextDouble() * 1.0, 2);
                if (_random.NextDouble() < 0.4)
                {
                    equipment.Element = (ElementType)_random.Next(1, 5);
                    equipment.ElementalDamage = (int)Math.Round(baseValue * 3);
                }
                break;
            case EquipSlot.Armor:
                equipment.Health = (int)Math.Round(baseValue * 50);
                equipment.Defense = (int)Math.Round(baseValue * 5);
                break;
            case EquipSlot.Pants:
                equipment.Health = (int)Math.Round(baseValue * 30);
                equipment.Defense = (int)Math.Round(baseValue * 3);
                break;
            case EquipSlot.Shoulder:
                equipment.Health = (int)Math.Round(baseValue * 20);
                equipment.Defense = (int)Math.Round(baseValue * 2);
                break;
            case EquipSlot.Belt:
                equipment.Health = (int)Math.Round(baseValue * 25);
                break;
            case EquipSlot.Shoes:
                equipment.Defense = (int)Math.Round(baseValue * 2);
                equipment.AttackSpeed = Math.Round(_random.NextDouble() * 0.2, 2);
                break;
            case EquipSlot.Earring:
                equipment.CritRate = Math.Round(0.05 + _random.NextDouble() * 0.1, 3);
                equipment.Attack = (int)Math.Round(baseValue * 2);
                break;
            case EquipSlot.Ring:
                equipment.CritDamage = Math.Round(0.3 + _random.NextDouble() * 0.5, 2);
                equipment.Attack = (int)Math.Round(baseValue * 3);
                break;
            case EquipSlot.Necklace:
                equipment.Health = (int)Math.Round(baseValue * 40);
                equipment.Defense = (int)Math.Round(baseValue * 4);
                if (_random.NextDouble() < 0.3)
                {
                    equipment.Element = (ElementType)_random.Next(1, 5);
                    equipment.ElementalDamage = (int)Math.Round(baseValue * 2);
                }
                break;
        }

        if ((int)rarity >= 2)
        {
            var affixCount = (int)rarity - 1;
            var affixList = new List<object>();
            for (var i = 0; i < affixCount; i++)
            {
                var affixType = (AffixType)_random.Next(0, Enum.GetValues(typeof(AffixType)).Length);
                var affixValue = Math.Round(baseValue * (0.5 + _random.NextDouble() * 0.5), 2);
                affixList.Add(new { Type = affixType, Value = affixValue });
            }
            equipment.AffixesJson = JsonSerializer.Serialize(affixList);
        }

        equipment.SocketedGemsJson = JsonSerializer.Serialize(new List<object>());

        await _equipmentRepository.AddAsync(equipment);

        return _mapper.Map<EquipmentOutput>(equipment);
    }

    /// <summary>
    /// 强化装备：按成功率（1-3级100%，4-6级75%，7-9级50%，10-12级25%，13-15级10%）随机判定强化结果，失败可能降级或归零，消耗强化材料
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">强化参数（装备 ID、使用保底符等）</param>
    /// <returns>强化结果输出（成功/失败、新强化等级、消耗材料、提示），玩家不存在或装备不存在返回 null</returns>
    public async Task<EnhanceResultOutput?> EnhanceEquipmentAsync(string playerId, EnhanceEquipmentInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipment = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == input.EquipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (equipment == null)
        {
            return null;
        }

        var oldLevel = equipment.EnhanceLevel;
        if (oldLevel >= 15)
        {
            return new EnhanceResultOutput
            {
                EquipmentId = equipment.Id,
                OldLevel = oldLevel,
                NewLevel = oldLevel,
                Success = false,
                GoldSpent = 0,
                AttackBonus = 0
            };
        }

        var nextLevel = oldLevel + 1;
        var successRate = nextLevel switch
        {
            <= 3 => 1.0,
            <= 6 => 0.75,
            <= 9 => 0.50,
            <= 12 => 0.25,
            <= 15 => 0.10,
            _ => 0
        };

        var goldCost = (long)Math.Round(100 * Math.Pow(1.5, oldLevel));
        if (player.Gold < goldCost)
        {
            return null;
        }

        player.Gold -= goldCost;
        player.LastActiveAt = DateTimeOffset.UtcNow;

        var roll = _random.NextDouble();
        bool success = roll < successRate;
        int newLevel = oldLevel;
        int? downgradeLevels = null;

        if (success)
        {
            newLevel = nextLevel;
            equipment.EnhanceLevel = newLevel;
        }
        else
        {
            if (nextLevel is >= 7 and <= 14)
            {
                newLevel = Math.Max(0, oldLevel - 1);
                downgradeLevels = oldLevel - newLevel;
                equipment.EnhanceLevel = newLevel;
            }
        }

        var attackBonus = (int)Math.Round(newLevel * (newLevel + 1) / 2.0 * 0.35);

        equipment.ModifiedAt = DateTimeOffset.UtcNow;
        _context.Equipments.Update(equipment);
        _playerRepository.UpdateAsync(player).GetAwaiter().GetResult();
        await _context.SaveChangesAsync();

        return new EnhanceResultOutput
        {
            EquipmentId = equipment.Id,
            OldLevel = oldLevel,
            NewLevel = newLevel,
            Success = success,
            GoldSpent = goldCost,
            AttackBonus = attackBonus,
            DowngradeLevels = downgradeLevels
        };
    }

    /// <summary>
    /// 为装备附加附魔效果：消耗指定附魔书道具，将附魔属性（攻击/生命/防御/暴击等）写入装备附魔字段
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">附魔参数（装备 ID、附魔书 ID）</param>
    /// <returns>附魔结果输出（成功/失败、新附魔属性、消耗材料），玩家不存在或装备/附魔书不存在返回 null</returns>
    public async Task<EnchantResultOutput?> EnchantEquipmentAsync(string playerId, EnchantEquipmentInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipment = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == input.EquipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (equipment == null)
        {
            return null;
        }

        var enchantItem = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == input.EnchantItemId && !i.IsDeleted);
        if (enchantItem == null || enchantItem.Count < 1)
        {
            return null;
        }

        enchantItem.Count -= 1;
        if (enchantItem.Count <= 0)
        {
            enchantItem.IsDeleted = true;
            enchantItem.DeletedAt = DateTimeOffset.UtcNow;
        }
        enchantItem.ModifiedAt = DateTimeOffset.UtcNow;
        _context.Inventory.Update(enchantItem);

        var goldCost = 500L;
        if (player.Gold < goldCost)
        {
            return null;
        }
        player.Gold -= goldCost;
        player.LastActiveAt = DateTimeOffset.UtcNow;

        var enchantStat = (EnchantStat)_random.Next(0, 5);
        double oldPercent = 0;
        double newPercent = enchantStat switch
        {
            EnchantStat.Attack => Math.Round(0.05 + _random.NextDouble() * 0.2, 3),
            EnchantStat.Health => Math.Round(0.05 + _random.NextDouble() * 0.15, 3),
            EnchantStat.Defense => Math.Round(0.05 + _random.NextDouble() * 0.15, 3),
            EnchantStat.CritRate => Math.Round(0.02 + _random.NextDouble() * 0.08, 3),
            EnchantStat.Resistance => Math.Round(0.05 + _random.NextDouble() * 0.1, 3),
            _ => 0
        };

        var enchantmentData = new
        {
            Stat = enchantStat,
            Percent = newPercent,
            ItemId = input.EnchantItemId
        };

        var enchantmentJson = JsonSerializer.Serialize(enchantmentData);

        var enchantmentProperty = typeof(Equipment).GetProperty("EnchantmentJson");
        if (enchantmentProperty != null)
        {
            enchantmentProperty.SetValue(equipment, enchantmentJson);
        }

        equipment.ModifiedAt = DateTimeOffset.UtcNow;
        _context.Equipments.Update(equipment);
        await _context.SaveChangesAsync();
        await _playerRepository.UpdateAsync(player);

        return new EnchantResultOutput
        {
            EquipmentId = equipment.Id,
            EnchantStat = enchantStat,
            OldPercent = oldPercent,
            NewPercent = newPercent,
            EnchantItemId = input.EnchantItemId,
            GoldSpent = goldCost
        };
    }

    /// <summary>
    /// 为装备镶嵌宝石：成功率递减（第1颗100%，2-6颗50%，7-14颗失败归零），失败时所有已镶嵌宝石可能碎裂消失，消耗宝石道具
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">镶嵌参数（装备 ID、宝石类型、宝石品质）</param>
    /// <returns>镶嵌结果输出（成功/失败、当前孔位、失败碎裂情况），玩家不存在或装备/宝石不足返回 null</returns>
    public async Task<GemSocketResultOutput?> SocketGemAsync(string playerId, SocketGemInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipment = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == input.EquipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (equipment == null)
        {
            return null;
        }

        var gemItem = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == input.GemItemId && !i.IsDeleted);
        if (gemItem == null || gemItem.Count < 1)
        {
            return null;
        }

        var gemList = string.IsNullOrEmpty(equipment.SocketedGemsJson)
            ? new List<object>()
            : JsonSerializer.Deserialize<List<object>>(equipment.SocketedGemsJson) ?? new List<object>();

        var currentCount = gemList.Count;
        if (currentCount >= 15)
        {
            return null;
        }

        gemItem.Count -= 1;
        if (gemItem.Count <= 0)
        {
            gemItem.IsDeleted = true;
            gemItem.DeletedAt = DateTimeOffset.UtcNow;
        }
        gemItem.ModifiedAt = DateTimeOffset.UtcNow;
        _context.Inventory.Update(gemItem);

        var goldCost = 200L * (currentCount + 1);
        if (player.Gold < goldCost)
        {
            return null;
        }
        player.Gold -= goldCost;
        player.LastActiveAt = DateTimeOffset.UtcNow;

        var gemType = (GemType)_random.Next(0, 5);
        var gemRarity = (GemRarity)_random.Next(0, 2);

        var nextCount = currentCount + 1;
        var successRate = nextCount switch
        {
            1 => 1.0,
            <= 6 => 0.50,
            <= 15 => 0.50,
            _ => 0
        };

        var roll = _random.NextDouble();
        bool success = roll < successRate;
        bool allReset = false;
        int socketedCount;

        if (success)
        {
            gemList.Add(new
            {
                Type = gemType,
                Rarity = gemRarity,
                ItemId = input.GemItemId
            });
            socketedCount = gemList.Count;
        }
        else
        {
            if (nextCount is >= 7 and <= 14)
            {
                gemList.Clear();
                allReset = true;
            }
            socketedCount = gemList.Count;
        }

        equipment.SocketedGemsJson = JsonSerializer.Serialize(gemList);
        equipment.ModifiedAt = DateTimeOffset.UtcNow;
        _context.Equipments.Update(equipment);
        await _context.SaveChangesAsync();
        await _playerRepository.UpdateAsync(player);

        return new GemSocketResultOutput
        {
            EquipmentId = equipment.Id,
            GemType = gemType,
            GemRarity = gemRarity,
            SocketedCount = socketedCount,
            Success = success,
            AllReset = allReset,
            GoldSpent = goldCost
        };
    }

    /// <summary>
    /// 分解装备：按品质倍率 × 等级系数计算金币收益（rarity倍率 * (1+level*0.1)），删除装备并获得金币
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">分解参数（装备 ID 列表）</param>
    /// <returns>分解结果输出（总金币收益、分解数量、消息），玩家不存在返回 null</returns>
    public async Task<SellItemsOutput?> DecomposeEquipmentAsync(string playerId, DecomposeEquipmentInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (input.EquipmentIds == null || input.EquipmentIds.Length == 0)
        {
            return new SellItemsOutput { TotalGold = 0, SoldCount = 0 };
        }

        long totalGold = 0;
        int soldCount = 0;

        foreach (var equipmentId in input.EquipmentIds)
        {
            var equipment = await _context.Equipments
                .FirstOrDefaultAsync(e => e.Id == equipmentId && e.PlayerId == playerId && !e.IsDeleted);
            if (equipment == null)
            {
                continue;
            }

            if (equipment.IsEquipped)
            {
                continue;
            }

            var rarityMultiplier = equipment.Rarity switch
            {
                EquipRarity.Common => 10,
                EquipRarity.Advanced => 30,
                EquipRarity.Fine => 80,
                EquipRarity.Legendary => 200,
                EquipRarity.Epic => 500,
                EquipRarity.Mythic => 1500,
                _ => 10
            };

            var goldGained = (long)Math.Round(rarityMultiplier * (1 + equipment.Level * 0.1));
            totalGold += goldGained;
            soldCount++;

            equipment.IsDeleted = true;
            equipment.DeletedAt = DateTimeOffset.UtcNow;
            equipment.ModifiedAt = DateTimeOffset.UtcNow;
            _context.Equipments.Update(equipment);
        }

        player.Gold += totalGold;
        player.LastActiveAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();
        await _playerRepository.UpdateAsync(player);

        return new SellItemsOutput
        {
            TotalGold = totalGold,
            SoldCount = soldCount
        };
    }

    /// <summary>
    /// 装备强化等级转移：将源装备的强化等级无损转移到目标装备（源装备清零，消耗金币转移费用）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">转移参数（源装备 ID、目标装备 ID）</param>
    /// <returns>强化结果输出（新等级、消耗金币、消息），玩家不存在或装备不存在返回 null</returns>
    public async Task<EnhanceResultOutput?> TransferEnhanceAsync(string playerId, TransferEnhanceInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var fromEquip = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == input.FromEquipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (fromEquip == null)
        {
            return null;
        }

        var toEquip = await _context.Equipments
            .FirstOrDefaultAsync(e => e.Id == input.ToEquipmentId && e.PlayerId == playerId && !e.IsDeleted);
        if (toEquip == null)
        {
            return null;
        }

        if (fromEquip.Slot != toEquip.Slot)
        {
            return null;
        }

        var oldFromLevel = fromEquip.EnhanceLevel;
        var oldToLevel = toEquip.EnhanceLevel;

        if (oldFromLevel <= oldToLevel)
        {
            return null;
        }

        var goldCost = (long)Math.Round(500 * Math.Pow(1.3, oldFromLevel));
        if (player.Gold < goldCost)
        {
            return null;
        }

        player.Gold -= goldCost;
        player.LastActiveAt = DateTimeOffset.UtcNow;

        var transferLevel = oldFromLevel;
        fromEquip.EnhanceLevel = 0;
        toEquip.EnhanceLevel = transferLevel;

        fromEquip.ModifiedAt = DateTimeOffset.UtcNow;
        toEquip.ModifiedAt = DateTimeOffset.UtcNow;
        _context.Equipments.Update(fromEquip);
        _context.Equipments.Update(toEquip);
        await _context.SaveChangesAsync();
        await _playerRepository.UpdateAsync(player);

        var attackBonus = (int)Math.Round(transferLevel * (transferLevel + 1) / 2.0 * 0.35);

        return new EnhanceResultOutput
        {
            EquipmentId = toEquip.Id,
            OldLevel = oldToLevel,
            NewLevel = transferLevel,
            Success = true,
            GoldSpent = goldCost,
            AttackBonus = attackBonus
        };
    }
}
