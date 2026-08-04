using ShotsGame.Core.Enums;

namespace ShotsGame.Core.Entities;

/// <summary>
/// 玩家天赋
/// </summary>
public class Talent : BaseEntity
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
    /// 天赋标识
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
    /// 影响属性名称
    /// </summary>
    public string Stat { get; set; } = string.Empty;
    /// <summary>
    /// 天赋数值
    /// </summary>
    public double Value { get; set; } = 0;
    /// <summary>
    /// 天赋描述
    /// </summary>
    public string Description { get; set; } = string.Empty;
}
