using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 背包系统服务：背包/仓库总览查询、物品增删、批量出售道具换取金币
/// </summary>
public class InventoryService : IInventoryService
{
    private const int EquipmentStorageCapacity = 100;
    private const int InventoryCapacity = 100;
    private const int GemCapacity = 50;
    private const int EnhanceCapacity = 30;
    private const int EnchantCapacity = 30;

    private static readonly Dictionary<EquipRarity, long> RaritySellPrices = new()
    {
        { EquipRarity.Common, 5 },
        { EquipRarity.Advanced, 15 },
        { EquipRarity.Fine, 40 },
        { EquipRarity.Legendary, 100 },
        { EquipRarity.Epic, 250 },
        { EquipRarity.Mythic, 600 }
    };

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public InventoryService(
        IPlayerRepository playerRepository,
        IRepository<ItemStack> itemStackRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _itemStackRepository = itemStackRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 获取玩家背包/仓库总览（普通背包、宝石、强化材料、附魔书、装备仓库的容量与物品列表）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>背包总览输出，玩家不存在返回 null</returns>
    public async Task<InventoryOutput?> GetInventoryAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equipmentStorage = await _context.Equipments
            .Where(e => e.PlayerId == playerId && !e.IsDeleted)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var allItems = await _context.Inventory
            .Where(i => i.PlayerId == playerId && !i.IsDeleted)
            .ToListAsync();

        var inventoryItems = new List<ItemStackOutput>();
        var gemItems = new List<ItemStackOutput>();
        var enhanceItems = new List<ItemStackOutput>();
        var enchantItems = new List<ItemStackOutput>();

        foreach (var item in allItems)
        {
            var output = MapToItemStackOutput(item);
            if (item.ItemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase))
            {
                gemItems.Add(output);
            }
            else if (item.ItemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase))
            {
                enchantItems.Add(output);
            }
            else if (item.ItemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase))
            {
                enhanceItems.Add(output);
            }
            else
            {
                inventoryItems.Add(output);
            }
        }

        return new InventoryOutput
        {
            EquipmentStorageCapacity = EquipmentStorageCapacity,
            EquipmentStorageCount = equipmentStorage.Count,
            InventoryCapacity = InventoryCapacity,
            InventoryCount = inventoryItems.Count,
            GemCapacity = GemCapacity,
            GemCount = gemItems.Count,
            EnhanceCapacity = EnhanceCapacity,
            EnhanceCount = enhanceItems.Count,
            EnchantCapacity = EnchantCapacity,
            EnchantCount = enchantItems.Count,
            EquipmentStorage = _mapper.Map<List<EquipmentOutput>>(equipmentStorage),
            InventoryItems = inventoryItems,
            GemItems = gemItems,
            EnhanceItems = enhanceItems,
            EnchantItems = enchantItems
        };
    }

    /// <summary>
    /// 向玩家背包添加物品（若已有同类型物品则合并堆叠，否则新建物品堆栈；超出容量无法添加）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">添加物品参数（物品 ID、数量、来源）</param>
    /// <returns>添加后的物品堆栈输出，玩家不存在或容量不足返回 null</returns>
    public async Task<ItemStackOutput?> AddItemAsync(string playerId, AddItemInput input)
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

        var capacity = GetCapacityForItem(input.ItemId);
        var currentCount = await GetCurrentItemCountByType(playerId, input.ItemId);

        var existingStack = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == input.ItemId && !i.IsDeleted);

        if (existingStack != null)
        {
            existingStack.Count += input.Count;
            await _itemStackRepository.UpdateAsync(existingStack);
            return MapToItemStackOutput(existingStack);
        }

        if (currentCount >= capacity)
        {
            return null;
        }

        var newStack = new ItemStack
        {
            PlayerId = playerId,
            ItemId = input.ItemId,
            Count = input.Count
        };
        await _itemStackRepository.AddAsync(newStack);

        return MapToItemStackOutput(newStack);
    }

    /// <summary>
    /// 从玩家背包移除指定数量物品（数量减为 0 时删除物品堆栈记录；数量不足则移除失败）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">移除物品参数（物品堆栈 ID、移除数量）</param>
    /// <returns>移除后的物品堆栈输出（数量为 0 返回已删除状态），玩家不存在或数量不足返回 null</returns>
    public async Task<ItemStackOutput?> RemoveItemAsync(string playerId, RemoveItemInput input)
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

        var existingStack = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == input.ItemId && !i.IsDeleted);

        if (existingStack == null || existingStack.Count < input.Count)
        {
            return null;
        }

        existingStack.Count -= input.Count;

        if (existingStack.Count <= 0)
        {
            await _itemStackRepository.DeleteAsync(existingStack.Id);
            return new ItemStackOutput
            {
                ItemId = input.ItemId,
                Count = 0,
                Name = GetItemName(input.ItemId),
                Rarity = GetItemRarity(input.ItemId),
                Type = GetItemType(input.ItemId)
            };
        }

        await _itemStackRepository.UpdateAsync(existingStack);
        return MapToItemStackOutput(existingStack);
    }

    /// <summary>
    /// 批量出售玩家背包中的多个物品堆栈，按物品基础价格 × 数量 × 稀有度倍率换算成金币并移除物品
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">出售参数（出售物品堆栈 ID 列表）</param>
    /// <returns>出售结果输出（总金币收益、已出售数量、消息），玩家不存在返回 null</returns>
    public async Task<SellItemsOutput?> SellItemsAsync(string playerId, SellItemsInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        long totalGold = 0;
        int soldCount = 0;

        foreach (var itemEntry in input.Items)
        {
            if (itemEntry.Count <= 0)
            {
                continue;
            }

            var stack = await _context.Inventory
                .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == itemEntry.ItemId && !i.IsDeleted);

            if (stack == null || stack.Count < itemEntry.Count)
            {
                continue;
            }

            var rarity = GetItemRarity(itemEntry.ItemId);
            var unitPrice = RaritySellPrices.TryGetValue(rarity, out var price) ? price : 5;
            totalGold += unitPrice * itemEntry.Count;
            soldCount += itemEntry.Count;

            stack.Count -= itemEntry.Count;
            if (stack.Count <= 0)
            {
                _context.Inventory.Remove(stack);
            }
            else
            {
                _context.Inventory.Update(stack);
            }
        }

        if (totalGold > 0)
        {
            player.Gold += totalGold;
            await _playerRepository.UpdateAsync(player);
            await _context.SaveChangesAsync();
        }

        return new SellItemsOutput
        {
            TotalGold = totalGold,
            SoldCount = soldCount
        };
    }

    private static int GetCapacityForItem(string itemId)
    {
        if (itemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase))
        {
            return GemCapacity;
        }
        if (itemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase))
        {
            return EnchantCapacity;
        }
        if (itemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase))
        {
            return EnhanceCapacity;
        }
        return InventoryCapacity;
    }

    private async Task<int> GetCurrentItemCountByType(string playerId, string itemId)
    {
        var allItems = await _context.Inventory
            .Where(i => i.PlayerId == playerId && !i.IsDeleted)
            .ToListAsync();

        if (itemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase))
        {
            return allItems.Count(i => i.ItemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase));
        }
        if (itemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase))
        {
            return allItems.Count(i => i.ItemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase));
        }
        if (itemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase))
        {
            return allItems.Count(i => i.ItemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase));
        }
        return allItems.Count(i =>
            !i.ItemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase) &&
            !i.ItemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase) &&
            !i.ItemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase));
    }

    private static ItemStackOutput MapToItemStackOutput(ItemStack item)
    {
        return new ItemStackOutput
        {
            ItemId = item.ItemId,
            Count = item.Count,
            Name = GetItemName(item.ItemId),
            Icon = GetItemIcon(item.ItemId),
            Description = GetItemDescription(item.ItemId),
            Rarity = GetItemRarity(item.ItemId),
            Type = GetItemType(item.ItemId)
        };
    }

    private static string GetItemName(string itemId)
    {
        return itemId switch
        {
            "potion_full" => "完全恢复药水",
            "potion_hp" => "普通血瓶",
            "grenade" => "手榴弹",
            _ => itemId
        };
    }

    private static string? GetItemIcon(string itemId)
    {
        return null;
    }

    private static string? GetItemDescription(string itemId)
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
}
