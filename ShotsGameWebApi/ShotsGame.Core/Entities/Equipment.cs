using ShotsGame.Core.Enums;

namespace ShotsGame.Core.Entities;

/// <summary>
/// 玩家拥有的装备实例
/// </summary>
public class Equipment : BaseEntity
{
    /// <summary>
    /// 玩家标识
    /// </summary>
    public string PlayerId { get; set; } = string.Empty;
    /// <summary>
    /// 关联玩家
    /// </summary>
    public Player Player { get; set; } = null!;

    /// <summary>
    /// 装备名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    /// <summary>
    /// 装备槽位
    /// </summary>
    public EquipSlot Slot { get; set; }
    /// <summary>
    /// 装备稀有度
    /// </summary>
    public EquipRarity Rarity { get; set; }
    /// <summary>
    /// 装备等级
    /// </summary>
    public int Level { get; set; } = 1;
    /// <summary>
    /// 强化等级
    /// </summary>
    public int EnhanceLevel { get; set; } = 0;

    /// <summary>
    /// 装备图标
    /// </summary>
    public string Icon { get; set; } = string.Empty;
    /// <summary>
    /// 装备描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 攻击力
    /// </summary>
    public int? Attack { get; set; }
    /// <summary>
    /// 攻击速度
    /// </summary>
    public double? AttackSpeed { get; set; }
    /// <summary>
    /// 射程
    /// </summary>
    public int? Range { get; set; }
    /// <summary>
    /// 生命值
    /// </summary>
    public int? Health { get; set; }
    /// <summary>
    /// 防御力
    /// </summary>
    public int? Defense { get; set; }
    /// <summary>
    /// 暴击率
    /// </summary>
    public double? CritRate { get; set; }
    /// <summary>
    /// 暴击伤害
    /// </summary>
    public double? CritDamage { get; set; }
    /// <summary>
    /// 穿刺
    /// </summary>
    public int? Pierce { get; set; }

    /// <summary>
    /// 元素类型
    /// </summary>
    public ElementType? Element { get; set; }
    /// <summary>
    /// 元素伤害
    /// </summary>
    public int? ElementalDamage { get; set; }

    /// <summary>
    /// 当前耐久度
    /// </summary>
    public int? Durability { get; set; }
    /// <summary>
    /// 最大耐久度
    /// </summary>
    public int? MaxDurability { get; set; }

    /// <summary>
    /// 是否已装备
    /// </summary>
    public bool IsEquipped { get; set; } = false;

    /// <summary>
    /// 词缀列表（JSON）
    /// </summary>
    public string? AffixesJson { get; set; }
    /// <summary>
    /// 已镶嵌宝石列表（JSON）
    /// </summary>
    public string? SocketedGemsJson { get; set; }
}
