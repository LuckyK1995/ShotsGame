using ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Codex;

/// <summary>
/// 图鉴条目出参
/// </summary>
public class CodexEntryOutput
{
    /// <summary>
    /// 图鉴条目ID
    /// </summary>
    public string EntryId { get; set; } = string.Empty;

    /// <summary>
    /// 条目类型（敌人/装备/道具）
    /// </summary>
    public CodexEntryType Type { get; set; }

    /// <summary>
    /// 条目名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 是否已发现该条目
    /// </summary>
    public bool Discovered { get; set; }

    /// <summary>
    /// 累计击杀数（敌人类型条目时有值）
    /// </summary>
    public int? Kills { get; set; }

    /// <summary>
    /// 累计获得数量（装备/道具类型条目时有值）
    /// </summary>
    public int? Obtained { get; set; }

    /// <summary>
    /// 条目详细描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 条目图标
    /// </summary>
    public string? Icon { get; set; }
}

/// <summary>
/// 图鉴总览出参
/// </summary>
public class CodexOutput
{
    /// <summary>
    /// 敌人图鉴条目列表
    /// </summary>
    public List<CodexEntryOutput> EnemyEntries { get; set; } = new();

    /// <summary>
    /// 装备图鉴条目列表
    /// </summary>
    public List<CodexEntryOutput> EquipmentEntries { get; set; } = new();

    /// <summary>
    /// 道具图鉴条目列表
    /// </summary>
    public List<CodexEntryOutput> ItemEntries { get; set; } = new();

    /// <summary>
    /// 敌人已发现数量
    /// </summary>
    public int EnemyDiscovered { get; set; }

    /// <summary>
    /// 敌人总数
    /// </summary>
    public int EnemyTotal { get; set; }

    /// <summary>
    /// 装备已发现数量
    /// </summary>
    public int EquipmentDiscovered { get; set; }

    /// <summary>
    /// 装备总数
    /// </summary>
    public int EquipmentTotal { get; set; }

    /// <summary>
    /// 道具已发现数量
    /// </summary>
    public int ItemDiscovered { get; set; }

    /// <summary>
    /// 道具总数
    /// </summary>
    public int ItemTotal { get; set; }
}

/// <summary>
/// 更新图鉴入参
/// </summary>
public class UpdateCodexInput
{
    /// <summary>
    /// 图鉴条目ID
    /// </summary>
    public string EntryId { get; set; } = string.Empty;

    /// <summary>
    /// 条目类型
    /// </summary>
    public CodexEntryType Type { get; set; }

    /// <summary>
    /// 击杀数增加量（敌人类型）
    /// </summary>
    public int? IncrementKills { get; set; }

    /// <summary>
    /// 获得数增加量（装备/道具类型）
    /// </summary>
    public int? IncrementObtained { get; set; }

    /// <summary>
    /// 是否标记为已发现
    /// </summary>
    public bool MarkDiscovered { get; set; } = false;
}
