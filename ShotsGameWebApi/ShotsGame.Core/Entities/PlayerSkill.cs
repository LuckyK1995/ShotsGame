namespace ShotsGame.Core.Entities;

/// <summary>
/// 玩家技能
/// </summary>
public class PlayerSkill : BaseEntity
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
    /// 技能标识
    /// </summary>
    public string SkillId { get; set; } = string.Empty;
    /// <summary>
    /// 技能等级
    /// </summary>
    public int Level { get; set; } = 0;
}
