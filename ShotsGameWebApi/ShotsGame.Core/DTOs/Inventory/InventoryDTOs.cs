using ShotsGame.Core.Enums;
using ShotsGame.Core.DTOs.Equipment;

namespace ShotsGame.Core.DTOs.Inventory;

/// <summary>
/// 道具堆出参
/// </summary>
public class ItemStackOutput
{
    /// <summary>
    /// 道具ID
    /// </summary>
    public string ItemId { get; set; } = string.Empty;

    /// <summary>
    /// 道具堆叠数量
    /// </summary>
    public int Count { get; set; }

    /// <summary>
    /// 道具名称
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 道具图标
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 道具描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 道具稀有度（装备/宝石类道具
    /// </summary>
    public EquipRarity? Rarity { get; set; }

    /// <summary>
    /// 道具类型名称
    /// </summary>
    public string? Type { get; set; }
}

/// <summary>
/// 背包出参
/// </summary>
public class InventoryOutput
{
    /// <summary>
    /// 装备仓库容量上限
    /// </summary>
    public int EquipmentStorageCapacity { get; set; } = 100;

    /// <summary>
    /// 装备仓库当前数量
    /// </summary>
    public int EquipmentStorageCount { get; set; }

    /// <summary>
    /// 普通道具背包容量上限
    /// </summary>
    public int InventoryCapacity { get; set; } = 100;

    /// <summary>
    /// 普通道具背包当前数量
    /// </summary>
    public int InventoryCount { get; set; }

    /// <summary>
    /// 宝石背包容量上限
    /// </summary>
    public int GemCapacity { get; set; } = 50;

    /// <summary>
    /// 宝石背包当前数量
    /// </summary>
    public int GemCount { get; set; }

    /// <summary>
    /// 强化石背包容量上限
    /// </summary>
    public int EnhanceCapacity { get; set; } = 30;

    /// <summary>
    /// 强化石背包当前数量
    /// </summary>
    public int EnhanceCount { get; set; }

    /// <summary>
    /// 附魔书背包容量上限
    /// </summary>
    public int EnchantCapacity { get; set; } = 30;

    /// <summary>
    /// 附魔书背包当前数量
    /// </summary>
    public int EnchantCount { get; set; }

    /// <summary>
    /// 装备仓库中的装备列表
    /// </summary>
    public List<EquipmentOutput> EquipmentStorage { get; set; } = new();

    /// <summary>
    /// 普通道具背包列表
    /// </summary>
    public List<ItemStackOutput> InventoryItems { get; set; } = new();

    /// <summary>
    /// 宝石背包列表
    /// </summary>
    public List<ItemStackOutput> GemItems { get; set; } = new();

    /// <summary>
    /// 强化石背包列表
    /// </summary>
    public List<ItemStackOutput> EnhanceItems { get; set; } = new();

    /// <summary>
    /// 附魔书背包列表
    /// </summary>
    public List<ItemStackOutput> EnchantItems { get; set; } = new();
}

/// <summary>
/// 添加物品入参
/// </summary>
public class AddItemInput
{
    /// <summary>
    /// 要添加的道具ID
    /// </summary>
    public string ItemId { get; set; } = string.Empty;

    /// <summary>
    /// 添加数量
    /// </summary>
    public int Count { get; set; }
}

/// <summary>
/// 移除物品入参
/// </summary>
public class RemoveItemInput
{
    /// <summary>
    /// 要移除的道具ID
    /// </summary>
    public string ItemId { get; set; } = string.Empty;

    /// <summary>
    /// 移除数量
    /// </summary>
    public int Count { get; set; }
}

/// <summary>
/// 批量出售入参
/// </summary>
public class SellItemsInput
{
    /// <summary>
    /// 要出售的物品列表
    /// </summary>
    public List<ItemIdCount> Items { get; set; } = new();

    /// <summary>
    /// 物品ID数量
    /// </summary>
    public class ItemIdCount
    {
        /// <summary>
        /// 道具ID
        /// </summary>
        public string ItemId { get; set; } = string.Empty;

        /// <summary>
        /// 出售数量
        /// </summary>
        public int Count { get; set; }
    }
}

/// <summary>
/// 出售出参
/// </summary>
public class SellItemsOutput
{
    /// <summary>
    /// 出售获得金币总数
    /// </summary>
    public long TotalGold { get; set; }

    /// <summary>
    /// 成功出售的物品数量
    /// </summary>
    public int SoldCount { get; set; }
}
