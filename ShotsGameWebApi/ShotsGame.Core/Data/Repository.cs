using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.Core.Models;

namespace ShotsGame.Core.Data;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly GameDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(GameDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(string id)
    {
        return await _dbSet.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.Where(e => !e.IsDeleted).ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(e => !e.IsDeleted).Where(predicate).ToListAsync();
    }

    public async Task<(IEnumerable<T> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        Expression<Func<T, bool>>? predicate = null)
    {
        var query = _dbSet.Where(e => !e.IsDeleted);

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<PagedResult<T>> GetPagedResultAsync(
        int page,
        int pageSize,
        Expression<Func<T, bool>>? predicate = null)
    {
        var (items, totalCount) = await GetPagedAsync(page, pageSize, predicate);
        return PagedResult<T>.Create(items.ToList(), totalCount, page, pageSize);
    }

    public async Task AddAsync(T entity)
    {
        entity.Id = string.IsNullOrEmpty(entity.Id) ? Guid.NewGuid().ToString("N") : entity.Id;
        entity.CreatedAt = DateTimeOffset.UtcNow;
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
    }

    public async Task AddRangeAsync(IEnumerable<T> entities)
    {
        foreach (var entity in entities)
        {
            entity.Id = string.IsNullOrEmpty(entity.Id) ? Guid.NewGuid().ToString("N") : entity.Id;
            entity.CreatedAt = DateTimeOffset.UtcNow;
        }
        await _dbSet.AddRangeAsync(entities);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(T entity)
    {
        entity.ModifiedAt = DateTimeOffset.UtcNow;
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(string id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            entity.IsDeleted = true;
            entity.DeletedAt = DateTimeOffset.UtcNow;
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _dbSet.AnyAsync(e => e.Id == id && !e.IsDeleted);
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        var query = _dbSet.Where(e => !e.IsDeleted);

        if (predicate != null)
        {
            return await query.CountAsync(predicate);
        }

        return await query.CountAsync();
    }
}
