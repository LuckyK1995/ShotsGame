using ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Enhance;

/// <summary>
/// 强化结果出参
/// </summary>
public class EnhanceResultOutput
{
    /// <summary>
    /// 被强化的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;

    /// <summary>
    /// 强化前的强化等级
    /// </summary>
    public int OldLevel { get; set; }

    /// <summary>
    /// 强化后的强化等级
    /// </summary>
    public int NewLevel { get; set; }

    /// <summary>
    /// 强化是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 本次强化消耗的金币
    /// </summary>
    public long GoldSpent { get; set; }

    /// <summary>
    /// 新增攻击力加成
    /// </summary>
    public int AttackBonus { get; set; }

    /// <summary>
    /// 强化失败时降低的等级数（为空表示未降级）
    /// </summary>
    public int? DowngradeLevels { get; set; }
}

/// <summary>
/// 附魔结果出参
/// </summary>
public class EnchantResultOutput
{
    /// <summary>
    /// 被附魔的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;

    /// <summary>
    /// 附魔的属性类型
    /// </summary>
    public EnchantStat EnchantStat { get; set; }

    /// <summary>
    /// 附魔前的属性百分比（为空表示首次附魔）
    /// </summary>
    public double? OldPercent { get; set; }

    /// <summary>
    /// 附魔后的属性百分比
    /// </summary>
    public double NewPercent { get; set; }

    /// <summary>
    /// 消耗的附魔书道具ID
    /// </summary>
    public string EnchantItemId { get; set; } = string.Empty;

    /// <summary>
    /// 本次附魔消耗的金币
    /// </summary>
    public long GoldSpent { get; set; }
}

/// <summary>
/// 镶嵌结果出参
/// </summary>
public class GemSocketResultOutput
{
    /// <summary>
    /// 被镶嵌宝石的装备ID
    /// </summary>
    public string EquipmentId { get; set; } = string.Empty;

    /// <summary>
    /// 镶嵌的宝石类型
    /// </summary>
    public GemType GemType { get; set; }

    /// <summary>
    /// 镶嵌的宝石稀有度
    /// </summary>
    public GemRarity GemRarity { get; set; }

    /// <summary>
    /// 装备上已镶嵌该类型宝石的数量
    /// </summary>
    public int SocketedCount { get; set; }

    /// <summary>
    /// 镶嵌是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 是否已重置全部宝石
    /// </summary>
    public bool AllReset { get; set; }

    /// <summary>
    /// 本次操作消耗的金币
    /// </summary>
    public long GoldSpent { get; set; }
}

/// <summary>
/// 宝石合成入参
/// </summary>
public class MergeGemInput
{
    /// <summary>
    /// 要合成的宝石类型
    /// </summary>
    public GemType GemType { get; set; }

    /// <summary>
    /// 合成前的宝石稀有度（即消耗的宝石稀有度）
    /// </summary>
    public GemRarity FromRarity { get; set; }

    /// <summary>
    /// 合成消耗的宝石数量（默认2颗）
    /// </summary>
    public int Count { get; set; } = 2;
}

/// <summary>
/// 合成结果出参
/// </summary>
public class MergeGemOutput
{
    /// <summary>
    /// 合成是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 合成后获得的新宝石ID
    /// </summary>
    public string NewGemId { get; set; } = string.Empty;

    /// <summary>
    /// 实际消耗的宝石数量
    /// </summary>
    public int ConsumedCount { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}

/// <summary>
/// 附魔书合成入参
/// </summary>
public class MergeEnchantInput
{
    /// <summary>
    /// 要合成的附魔属性类型
    /// </summary>
    public EnchantStat Stat { get; set; }

    /// <summary>
    /// 合成前的附魔书稀有度（即消耗的附魔书稀有度）
    /// </summary>
    public EquipRarity FromRarity { get; set; }

    /// <summary>
    /// 合成消耗的附魔书数量（默认2本）
    /// </summary>
    public int Count { get; set; } = 2;
}

/// <summary>
/// 合成出参
/// </summary>
public class MergeEnchantOutput
{
    /// <summary>
    /// 合成是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 合成后获得的新附魔书ID
    /// </summary>
    public string NewEnchantId { get; set; } = string.Empty;

    /// <summary>
    /// 实际消耗的附魔书数量
    /// </summary>
    public int ConsumedCount { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}
