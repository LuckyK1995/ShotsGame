using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;

namespace ShotsGame.Core.Data;

public class PlayerRepository : Repository<Player>, IPlayerRepository
{
    public PlayerRepository(GameDbContext context) : base(context)
    {
    }

    public async Task<Player?> GetByUsernameAsync(string username)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Username == username && !u.IsDeleted);
    }

    public async Task<Player?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
    }

    public async Task<Player?> GetProfileAsync(string id)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
    }

    public async Task<IEnumerable<Player>> GetLeaderboardAsync(int top, string sortBy = "score")
    {
        var query = _dbSet.Where(p => !p.IsDeleted);

        // 统一排序：战斗力 > 积分 > 等级（从大到小）
        query = query.OrderByDescending(p => p.Power)
                     .ThenByDescending(p => p.Score)
                     .ThenByDescending(p => p.Level);

        return await query.Take(top).ToListAsync();
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        return await _dbSet.AnyAsync(u => u.Username == username && !u.IsDeleted);
    }
}
