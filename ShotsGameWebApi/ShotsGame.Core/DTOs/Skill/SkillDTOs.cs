namespace ShotsGame.Core.DTOs.Skill;

// ─── 出参 ───

/// <summary>
/// 技能出参
/// </summary>
public class SkillOutput
{
    /// <summary>
    /// 技能ID
    /// </summary>
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// 技能名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 技能效果描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 技能当前等级
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// 技能最大等级
    /// </summary>
    public int MaxLevel { get; set; }

    /// <summary>
    /// 是否已解锁该技能
    /// </summary>
    public bool Unlocked { get; set; }

    /// <summary>
    /// 解锁所需玩家等级
    /// </summary>
    public int RequiredLevel { get; set; }

    /// <summary>
    /// 升级或学习所需技能点消耗
    /// </summary>
    public int Cost { get; set; }

    /// <summary>
    /// 前置技能ID（需要先学习的技能，为空表示无前置）
    /// </summary>
    public string? PreconditionSkillId { get; set; }

    /// <summary>
    /// 技能图标
    /// </summary>
    public string? Icon { get; set; }
}

/// <summary>
/// 技能树出参
/// </summary>
public class SkillTreeOutput
{
    /// <summary>
    /// 属性类技能列表
    /// </summary>
    public List<SkillOutput> AttributeSkills { get; set; } = new();

    /// <summary>
    /// 效果类技能列表
    /// </summary>
    public List<SkillOutput> EffectSkills { get; set; } = new();

    /// <summary>
    /// 分身/召唤类技能列表
    /// </summary>
    public List<SkillOutput> CloneSkills { get; set; } = new();

    /// <summary>
    /// 已使用的技能点数
    /// </summary>
    public int UsedPoints { get; set; }

    /// <summary>
    /// 可用的技能点数
    /// </summary>
    public int AvailablePoints { get; set; }
}

// ─── 入参 ───

/// <summary>
/// 升级技能入参
/// </summary>
public class UpgradeSkillInput
{
    /// <summary>
    /// 要升级的技能ID
    /// </summary>
    public string SkillId { get; set; } = string.Empty;
}

/// <summary>
/// 降级技能入参
/// </summary>
public class DowngradeSkillInput
{
    /// <summary>
    /// 要降级的技能ID
    /// </summary>
    public string SkillId { get; set; } = string.Empty;
}
