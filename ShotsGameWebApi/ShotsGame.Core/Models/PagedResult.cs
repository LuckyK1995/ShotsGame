using System.Text.Json.Serialization;

namespace ShotsGame.Core.Models;

/// <summary>分页结果</summary>
public class PagedResult<T>
{
    /// <summary>当前页数据</summary>
    [JsonPropertyName("items")]
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();

    /// <summary>总条数</summary>
    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }

    /// <summary>当前页码（从 1 开始）</summary>
    [JsonPropertyName("page")]
    public int Page { get; set; }

    /// <summary>每页大小</summary>
    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    /// <summary>是否有下一页</summary>
    [JsonPropertyName("hasNextPage")]
    public bool HasNextPage { get; set; }

    /// <summary>构造分页结果</summary>
    public static PagedResult<T> Create(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
        => new()
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount
        };
}
