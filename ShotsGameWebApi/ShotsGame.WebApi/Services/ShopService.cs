using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.DTOs.Shop;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 商店系统服务：商品列表查询（装备 + 消耗品）、使用金币购买商品、消耗金币刷新商店
/// </summary>
public class ShopService : IShopService
{
    private const int BaseRefreshCost = 50;
    private const int WaveRefreshCostMultiplier = 5;
    private const int EquipmentShopCount = 3;
    private const int ConsumableShopCount = 3;

    private static readonly Dictionary<EquipRarity, long> EquipmentRarityPrices = new()
    {
        { EquipRarity.Common, 100 },
        { EquipRarity.Advanced, 300 },
        { EquipRarity.Fine, 800 },
        { EquipRarity.Legendary, 2000 },
        { EquipRarity.Epic, 5000 },
        { EquipRarity.Mythic, 15000 }
    };

    private static readonly Dictionary<string, long> ConsumablePrices = new()
    {
        { "potion_full", 200 },
        { "potion_hp", 50 },
        { "grenade", 80 }
    };

    private static readonly object _shopLock = new();
    private static readonly Dictionary<string, PlayerShopState> _playerShops = new();

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<Equipment> _equipmentRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public ShopService(
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
    /// 获取玩家当前商店商品列表（装备商店 + 消耗品商店），不存在则根据当前波次刷新生成
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="currentWave">当前波次（影响刷新费用计算）</param>
    /// <returns>商店输出（商品列表、刷新费用、当前波次），玩家不存在返回 null</returns>
    public async Task<ShopOutput?> GetShopAsync(string playerId, int currentWave = 1)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        currentWave = currentWave <= 0 ? 1 : currentWave;
        var refreshCost = BaseRefreshCost + (long)currentWave * WaveRefreshCostMultiplier;

        var shopItems = GetOrCreateShop(playerId, currentWave);

        return new ShopOutput
        {
            Items = shopItems,
            RefreshCost = refreshCost,
            CurrentWave = currentWave
        };
    }

    /// <summary>
    /// 购买商店指定商品：校验玩家金币是否足够、商品是否已售，扣除金币后发放装备或消耗品
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">购买参数（商店商品索引、商品类型、商品 ID）</param>
    /// <returns>购买成功商品输出，玩家不存在或金币不足或商品已售返回 null</returns>
    public async Task<ShopItemOutput?> BuyItemAsync(string playerId, BuyShopItemInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        PlayerShopState? shopState;
        lock (_shopLock)
        {
            if (!_playerShops.TryGetValue(playerId, out shopState))
            {
                return null;
            }
        }

        var shopItem = shopState.Items.FirstOrDefault(i => i.Id == input.ShopItemId);
        if (shopItem == null || shopItem.Sold)
        {
            return null;
        }

        if (player.Gold < shopItem.Price)
        {
            return null;
        }

        player.Gold -= shopItem.Price;

        switch (shopItem.Type)
        {
            case ShopItemType.Refill:
                player.LastActiveAt = DateTimeOffset.UtcNow;
                break;

            case ShopItemType.Item:
                if (!string.IsNullOrEmpty(shopItem.ItemId))
                {
                    await AddItemToInventoryInternal(playerId, shopItem.ItemId, 1);
                }
                break;

            case ShopItemType.Equipment:
                var generatedEquip = GenerateRandomEquipment(playerId, shopState.Wave);
                generatedEquip.Rarity = InferRarityFromPrice(shopItem.Price);
                await _equipmentRepository.AddAsync(generatedEquip);
                shopItem.EquipmentOutput = _mapper.Map<EquipmentOutput>(generatedEquip);
                break;
        }

        shopItem.Sold = true;
        await _playerRepository.UpdateAsync(player);

        return shopItem;
    }

    /// <summary>
    /// 刷新玩家商店：按当前波次计算刷新费用，扣除金币后重新生成装备和消耗品商品
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="currentWave">当前波次（影响刷新费用计算）</param>
    /// <returns>刷新结果输出（新商品列表、消耗金币、消息），玩家不存在或金币不足返回 null</returns>
    public async Task<RefreshShopOutput?> RefreshShopAsync(string playerId, int currentWave = 1)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        currentWave = currentWave <= 0 ? 1 : currentWave;
        var refreshCost = BaseRefreshCost + (long)currentWave * WaveRefreshCostMultiplier;

        if (player.Gold < refreshCost)
        {
            return null;
        }

        player.Gold -= refreshCost;
        await _playerRepository.UpdateAsync(player);

        var newItems = GenerateShopItems(playerId, currentWave);

        lock (_shopLock)
        {
            _playerShops[playerId] = new PlayerShopState
            {
                Wave = currentWave,
                Items = newItems
            };
        }

        return new RefreshShopOutput
        {
            Items = newItems,
            GoldSpent = refreshCost
        };
    }

    private List<ShopItemOutput> GetOrCreateShop(string playerId, int currentWave)
    {
        lock (_shopLock)
        {
            if (_playerShops.TryGetValue(playerId, out var existing) && existing.Wave == currentWave)
            {
                return existing.Items;
            }

            var newItems = GenerateShopItems(playerId, currentWave);
            _playerShops[playerId] = new PlayerShopState
            {
                Wave = currentWave,
                Items = newItems
            };
            return newItems;
        }
    }

    private static List<ShopItemOutput> GenerateShopItems(string playerId, int wave)
    {
        var items = new List<ShopItemOutput>(ConsumableShopCount + EquipmentShopCount);
        var rnd = new Random(Guid.NewGuid().GetHashCode());

        items.Add(CreateConsumableItem("potion_full", "完全恢复药水", ShopItemType.Refill));
        items.Add(CreateConsumableItem("potion_hp", "普通血瓶", ShopItemType.Item));
        items.Add(CreateConsumableItem("grenade", "手榴弹", ShopItemType.Item));

        for (var i = 0; i < EquipmentShopCount; i++)
        {
            var rarity = RollRarity(rnd, wave);
            var price = EquipmentRarityPrices.TryGetValue(rarity, out var p) ? p : 100;
            var slot = (EquipSlot)rnd.Next(Enum.GetValues<EquipSlot>().Length);
            items.Add(new ShopItemOutput
            {
                Id = Guid.NewGuid().ToString("N"),
                Type = ShopItemType.Equipment,
                Price = price,
                Sold = false,
                ItemId = null,
                EquipmentOutput = new EquipmentOutput
                {
                    Id = string.Empty,
                    Name = GenerateEquipmentName(slot, rarity),
                    Slot = slot,
                    Rarity = rarity,
                    Level = Math.Max(1, wave / 3),
                    Icon = string.Empty,
                    Description = $"商店售卖的{GetRarityName(rarity)}装备"
                }
            });
        }

        return items;
    }

    private static ShopItemOutput CreateConsumableItem(string itemId, string name, ShopItemType type)
    {
        var price = ConsumablePrices.TryGetValue(itemId, out var p) ? p : 50;
        return new ShopItemOutput
        {
            Id = Guid.NewGuid().ToString("N"),
            Type = type,
            Price = price,
            Sold = false,
            ItemId = itemId,
            ItemDetail = new ItemStackOutput
            {
                ItemId = itemId,
                Count = 1,
                Name = name,
                Rarity = EquipRarity.Common,
                Type = "Item"
            }
        };
    }

    private static EquipRarity RollRarity(Random rnd, int wave)
    {
        var roll = rnd.NextDouble();
        var waveBonus = Math.Min(0.3, wave * 0.005);

        if (roll < 0.01 + waveBonus * 0.1) return EquipRarity.Mythic;
        if (roll < 0.05 + waveBonus * 0.3) return EquipRarity.Epic;
        if (roll < 0.15 + waveBonus * 0.6) return EquipRarity.Legendary;
        if (roll < 0.35 + waveBonus) return EquipRarity.Fine;
        if (roll < 0.65 + waveBonus) return EquipRarity.Advanced;
        return EquipRarity.Common;
    }

    private static string GenerateEquipmentName(EquipSlot slot, EquipRarity rarity)
    {
        var rarityName = GetRarityName(rarity);
        var slotName = slot switch
        {
            EquipSlot.Weapon => "武器",
            EquipSlot.Armor => "护甲",
            EquipSlot.Pants => "裤子",
            EquipSlot.Shoulder => "护肩",
            EquipSlot.Belt => "腰带",
            EquipSlot.Shoes => "鞋子",
            EquipSlot.Earring => "耳环",
            EquipSlot.Ring => "戒指",
            EquipSlot.Necklace => "项链",
            _ => "装备"
        };
        return $"{rarityName}{slotName}";
    }

    private static string GetRarityName(EquipRarity rarity)
    {
        return rarity switch
        {
            EquipRarity.Common => "普通",
            EquipRarity.Advanced => "高级",
            EquipRarity.Fine => "精良",
            EquipRarity.Legendary => "传奇",
            EquipRarity.Epic => "史诗",
            EquipRarity.Mythic => "神话",
            _ => "普通"
        };
    }

    private static EquipRarity InferRarityFromPrice(long price)
    {
        return EquipmentRarityPrices
            .OrderByDescending(kv => kv.Value)
            .FirstOrDefault(kv => price >= kv.Value)
            .Key;
    }

    private async Task<bool> AddItemToInventoryInternal(string playerId, string itemId, int count)
    {
        var existing = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == itemId && !i.IsDeleted);

        if (existing != null)
        {
            existing.Count += count;
            await _itemStackRepository.UpdateAsync(existing);
            return true;
        }

        var stack = new ItemStack
        {
            PlayerId = playerId,
            ItemId = itemId,
            Count = count
        };
        await _itemStackRepository.AddAsync(stack);
        return true;
    }

    private static Equipment GenerateRandomEquipment(string playerId, int wave)
    {
        var rnd = new Random(Guid.NewGuid().GetHashCode());
        var slots = Enum.GetValues<EquipSlot>();
        var rarities = Enum.GetValues<EquipRarity>();
        var slot = slots[rnd.Next(slots.Length)];
        var level = Math.Max(1, wave / 3);

        return new Equipment
        {
            PlayerId = playerId,
            Name = $"装备",
            Slot = slot,
            Rarity = EquipRarity.Common,
            Level = level,
            Icon = string.Empty,
            Description = string.Empty,
            Attack = 10 + level * 2 + rnd.Next(level),
            Defense = 5 + level,
            Health = 20 + level * 5
        };
    }

    private class PlayerShopState
    {
        public int Wave { get; set; }
        public List<ShopItemOutput> Items { get; set; } = new();
    }
}
