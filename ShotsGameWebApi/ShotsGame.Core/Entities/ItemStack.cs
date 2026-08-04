namespace ShotsGame.Core.Entities;

/// <summary>
/// 玩家背包道具堆叠
/// </summary>
public class ItemStack : BaseEntity
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
    /// 道具标识
    /// </summary>
    public string ItemId { get; set; } = string.Empty;
    /// <summary>
    /// 道具数量
    /// </summary>
    public int Count { get; set; } = 0;
}
