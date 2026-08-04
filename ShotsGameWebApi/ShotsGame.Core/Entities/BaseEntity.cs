namespace ShotsGame.Core.Entities;

/// <summary>
/// 所有实体的基类，包含软删除和审计字段
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// 实体唯一标识
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    /// <summary>
    /// 创建人标识
    /// </summary>
    public string? CreatorId { get; set; }
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    /// <summary>
    /// 修改人标识
    /// </summary>
    public string? ModifierId { get; set; }
    /// <summary>
    /// 修改时间
    /// </summary>
    public DateTimeOffset? ModifiedAt { get; set; }
    /// <summary>
    /// 删除人标识
    /// </summary>
    public string? DeleterId { get; set; }
    /// <summary>
    /// 删除时间
    /// </summary>
    public DateTimeOffset? DeletedAt { get; set; }
    /// <summary>
    /// 是否已删除
    /// </summary>
    public bool IsDeleted { get; set; } = false;
}
