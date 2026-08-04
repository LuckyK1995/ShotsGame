using ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Talent;

// ─── 出参 ───

/// <summary>
/// 天赋出参
/// </summary>
public class TalentOutput
{
    /// <summary>
    /// 天赋ID
    /// </summary>
    public string TalentId { get; set; } = string.Empty;

    /// <summary>
    /// 天赋名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 天赋稀有度
    /// </summary>
    public TalentRarity Rarity { get; set; }

    /// <summary>
    /// 影响的属性名称
    /// </summary>
    public string Stat { get; set; } = string.Empty;

    /// <summary>
    /// 属性加成数值
    /// </summary>
    public double Value { get; set; }

    /// <summary>
    /// 天赋详细描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 天赋图标
    /// </summary>
    public string? Icon { get; set; }
}

/// <summary>
/// 天赋三选一选项出参
/// </summary>
public class TalentChoicesOutput
{
    /// <summary>
    /// 可选天赋列表
    /// </summary>
    public List<TalentOutput> Choices { get; set; } = new();

    /// <summary>
    /// 是否可以跳过本次选择
    /// </summary>
    public bool CanSkip { get; set; }
}

// ─── 入参 ───

/// <summary>
/// 选择天赋入参
/// </summary>
public class ChooseTalentInput
{
    /// <summary>
    /// 选择的天赋ID
    /// </summary>
    public string TalentId { get; set; } = string.Empty;
}
