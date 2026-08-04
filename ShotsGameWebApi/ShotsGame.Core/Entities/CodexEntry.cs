using ShotsGame.Core.Enums;

namespace ShotsGame.Core.Entities;

/// <summary>
/// 图鉴条目
/// </summary>
public class CodexEntry : BaseEntity
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
    /// 条目标识
    /// </summary>
    public string EntryId { get; set; } = string.Empty;
    /// <summary>
    /// 条目类型
    /// </summary>
    public CodexEntryType Type { get; set; }
    /// <summary>
    /// 条目名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    /// <summary>
    /// 是否已发现
    /// </summary>
    public bool Discovered { get; set; } = false;
    /// <summary>
    /// 击杀次数
    /// </summary>
    public int? Kills { get; set; }
    /// <summary>
    /// 获得次数
    /// </summary>
    public int? Obtained { get; set; }
    /// <summary>
    /// 条目描述
    /// </summary>
    public string Description { get; set; } = string.Empty;
}
