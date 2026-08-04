using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.DTOs.Common;
using ShotsGame.Core.Models;

namespace ShotsGame.Core.Extensions;

public static class PagedQueryExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
        where T : class
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<T>.Create(items, totalCount, page, pageSize);
    }

    public static PagedResult<T> ToPagedResult<T>(
        this IEnumerable<T> source,
        int page,
        int pageSize)
        where T : class
    {
        var list = source.ToList();
        var totalCount = list.Count;
        var items = list
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return PagedResult<T>.Create(items, totalCount, page, pageSize);
    }

    public static PagedResult<T> ToPagedResult<T>(
        this IEnumerable<T> source,
        PagedQueryInput request)
        where T : class
        => source.ToPagedResult(request.Page, request.PageSize);

    public static async Task<PagedResult<TDestination>> ProjectToPagedResultAsync<TSource, TDestination>(
        this IQueryable<TSource> query,
        IConfigurationProvider configuration,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
        where TSource : class
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<TDestination>(configuration)
            .ToListAsync(cancellationToken);

        return PagedResult<TDestination>.Create(items, totalCount, page, pageSize);
    }

    public static PagedResult<TDestination> MapPagedResult<TSource, TDestination>(
        this IMapper mapper,
        PagedResult<TSource> source)
        where TSource : class
    {
        var items = mapper.Map<IReadOnlyList<TDestination>>(source.Items);
        return PagedResult<TDestination>.Create(items, source.TotalCount, source.Page, source.PageSize);
    }
}
