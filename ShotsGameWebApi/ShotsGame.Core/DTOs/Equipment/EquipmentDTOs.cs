using ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Equipment;

// ─── 出参 ───

/// <summary>
/// 装备出参
/// </summary>
public class EquipmentOutput
{
    /// <summary>
    /// 装备实例唯一ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 装备名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 装备槽位（武器/头盔/护甲等）
    /// </summary>
    public EquipSlot Slot { get; set; }

    /// <summary>
    /// 装备稀有度
    /// </summary>
    public EquipRarity Rarity { get; set; }

    /// <summary>
    /// 装备等级需求
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// 强化等级
    /// </summary>
    public int EnhanceLevel { get; set; }

    /// <summary>
    /// 装备图标
    /// </summary>
    public string Icon { get; set; } = string.Empty;

    /// <summary>
    /// 装备描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 攻击力加成
    /// </summary>
    public int? Attack { get; set; }

    /// <summary>
    /// 攻击速度加成
    /// </summary>
    public double? AttackSpeed { get; set; }

    /// <summary>
    /// 射程加成
    /// </summary>
    public int? Range { get; set; }

    /// <summary>
    /// 生命值加成
    /// </summary>
    public int? Health { get; set; }

    /// <summary>
    /// 防御力加成
    /// </summary>
    public int? Defense { get; set; }

    /// <summary>
    /// 暴击率加成
    /// </summary>
    public double? CritRate { get; set; }

    /// <summary>
    /// 暴击伤害加成
    /// </summary>
    public double? CritDamage { get; set; }

    /// <summary>
    /// 穿透值加成
    /// </summary>
    public int? Pierce { get; set; }

    /// <summary>
    /// 元素类型（无元素则为空）
    /// </summary>
    public ElementType? Element { get; set; }

    /// <summary>
    /// 元素伤害值
    /// </summary>
    public int? ElementalDamage { get; set; }

    /// <summary>
    /// 当前耐久度
    /// </summary>
    public int Durability { get; set; }

    /// <summary>
    /// 最大耐久度
    /// </summary>
    public int MaxDurability { get; set; }

    /// <summary>
    /// 是否已装备到角色身上
    /// </summary>
    public bool IsEquipped { get; set; }

    /// <summary>
    /// 词缀数据（JSON 字符串格式）
    /// </summary>
    public string? AffixesJson { get; set; }

    /// <summary>
    /// 已镶嵌宝石数据（JSON 字符串格式）
    /// </summary>
    public string? SocketedGemsJson { get; set; }

    /// <summary>
    /// 附魔数据（JSON 字符串格式）
    /// </summary>
    public string? EnchantmentJson { get; set; }
}

// ─── 入参 ───

/// <summary>
/// 装备入参
/// </summary>
public class EquipItemInput
{
    /// <summary>
    /// 要装备的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;
}

/// <summary>
/// 卸下装备入参
/// </summary>
public class UnequipItemInput
{
    /// <summary>
    /// 要卸下的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;
}

/// <summary>
/// 生成装备入参
/// </summary>
public class GenerateEquipmentInput
{
    /// <summary>
    /// 指定装备槽位（不指定则随机）
    /// </summary>
    public EquipSlot? Slot { get; set; }

    /// <summary>
    /// 指定装备稀有度（不指定则随机）
    /// </summary>
    public EquipRarity? Rarity { get; set; }

    /// <summary>
    /// 装备等级（影响基础属性数值）
    /// </summary>
    public int Level { get; set; } = 1;
}

/// <summary>
/// 强化装备入参
/// </summary>
public class EnhanceEquipmentInput
{
    /// <summary>
    /// 要强化的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;

    /// <summary>
    /// 使用的强化增幅道具ID（不使用则为空）
    /// </summary>
    public string? UseBoosterId { get; set; }
}

/// <summary>
/// 附魔装备入参
/// </summary>
public class EnchantEquipmentInput
{
    /// <summary>
    /// 要附魔的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;

    /// <summary>
    /// 使用的附魔书道具ID
    /// </summary>
    public string EnchantItemId { get; set; } = string.Empty;
}

/// <summary>
/// 镶嵌宝石入参
/// </summary>
public class SocketGemInput
{
    /// <summary>
    /// 要镶嵌宝石的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;

    /// <summary>
    /// 使用的宝石道具ID
    /// </summary>
    public string GemItemId { get; set; } = string.Empty;
}

/// <summary>
/// 分解装备入参
/// </summary>
public class DecomposeEquipmentInput
{
    /// <summary>
    /// 要分解的装备ID数组
    /// </summary>
    public string[] EquipmentIds { get; set; } = Array.Empty<string>();
}

/// <summary>
/// 强化转移入参
/// </summary>
public class TransferEnhanceInput
{
    /// <summary>
    /// 转移强化等级的源装备ID
    /// </summary>
    public string FromEquipmentId { get; set; } = string.Empty;

    /// <summary>
    /// 接收强化等级的目标装备ID
    /// </summary>
    public string ToEquipmentId { get; set; } = string.Empty;
}
