using System.Text.Json.Serialization;

namespace ShotsGame.Core.DTOs.Common;

/// <summary>
/// 分页查询入参
/// </summary>
public class PagedQueryInput
{
    /// <summary>
    /// 页码（从 1 开始）
    /// </summary>
    [JsonPropertyName("page")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每页大小
    /// </summary>
    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; } = 20;
}
