using ShotsGame.Core.Enums;
using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Inventory;

namespace ShotsGame.Core.DTOs.Shop;

/// <summary>
/// 商品出参
/// </summary>
public class ShopItemOutput
{
    /// <summary>
    /// 商店商品ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 商品类型（装备/道具等）
    /// </summary>
    public ShopItemType Type { get; set; }

    /// <summary>
    /// 商品价格（金币）
    /// </summary>
    public long Price { get; set; }

    /// <summary>
    /// 是否已售出
    /// </summary>
    public bool Sold { get; set; }

    /// <summary>
    /// 关联的道具ID（类型为道具时有值）
    /// </summary>
    public string? ItemId { get; set; }

    /// <summary>
    /// 装备详情（类型为装备时有值）
    /// </summary>
    public EquipmentOutput? EquipmentOutput { get; set; }

    /// <summary>
    /// 道具详情（类型为道具时有值）
    /// </summary>
    public ItemStackOutput? ItemDetail { get; set; }
}

/// <summary>
/// 商店出参
/// </summary>
public class ShopOutput
{
    /// <summary>
    /// 商店商品列表
    /// </summary>
    public List<ShopItemOutput> Items { get; set; } = new();

    /// <summary>
    /// 手动刷新商店所需金币
    /// </summary>
    public long RefreshCost { get; set; }

    /// <summary>
    /// 当前波次（商店刷新基于波次）
    /// </summary>
    public int CurrentWave { get; set; }
}

/// <summary>
/// 购买商品入参
/// </summary>
public class BuyShopItemInput
{
    /// <summary>
    /// 要购买的商店商品ID
    /// </summary>
    public string ShopItemId { get; set; } = string.Empty;
}

/// <summary>
/// 刷新商店出参
/// </summary>
public class RefreshShopOutput
{
    /// <summary>
    /// 刷新后的商店商品列表
    /// </summary>
    public List<ShopItemOutput> Items { get; set; } = new();

    /// <summary>
    /// 本次刷新消耗的金币
    /// </summary>
    public long GoldSpent { get; set; }
}
