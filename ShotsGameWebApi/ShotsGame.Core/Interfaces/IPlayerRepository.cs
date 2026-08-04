using ShotsGame.Core.Entities;

namespace ShotsGame.Core.Interfaces;

public interface IPlayerRepository : IRepository<Player>
{
    Task<Player?> GetByUsernameAsync(string username);
    Task<Player?> GetByEmailAsync(string email);
    Task<Player?> GetProfileAsync(string id);
    Task<IEnumerable<Player>> GetLeaderboardAsync(int top);
    Task<bool> ExistsByUsernameAsync(string username);
}
