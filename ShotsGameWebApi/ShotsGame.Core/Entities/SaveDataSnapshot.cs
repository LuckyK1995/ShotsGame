namespace ShotsGame.Core.Entities;

/// <summary>
/// 存档快照
/// </summary>
public class SaveDataSnapshot : BaseEntity
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
    /// 存档数据（JSON）
    /// </summary>
    public string SaveDataJson { get; set; } = string.Empty;

    /// <summary>
    /// 存档版本号
    /// </summary>
    public int Version { get; set; } = 1;

    /// <summary>
    /// 保存时间
    /// </summary>
    public DateTimeOffset SavedAt { get; set; } = DateTimeOffset.UtcNow;
}
