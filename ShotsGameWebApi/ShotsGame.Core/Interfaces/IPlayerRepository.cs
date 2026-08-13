using ShotsGame.Core.Entities;

namespace ShotsGame.Core.Interfaces;

public interface IPlayerRepository : IRepository<Player>
{
    Task<Player?> GetByUsernameAsync(string username);
    Task<Player?> GetByEmailAsync(string email);
    Task<Player?> GetProfileAsync(string id);
    /// <summary>
    /// 获取排行榜（按指定字段降序取前 N 名）
    /// </summary>
    /// <param name="top">取前几名</param>
    /// <param name="sortBy">排序字段：power=战斗力降序、level=等级降序、score=积分降序（默认）</param>
    Task<IEnumerable<Player>> GetLeaderboardAsync(int top, string sortBy = "score");
    Task<bool> ExistsByUsernameAsync(string username);
}
