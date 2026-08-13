using ShotsGame.Core.DTOs.Player;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 玩家服务接口，负责玩家档案查询、档案更新与排行榜查询等业务
/// </summary>
public interface IPlayerService
{
    /// <summary>
    /// 获取玩家完整档案信息（等级、经验、属性、资源等）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>玩家档案详情，若不存在则返回 null</returns>
    Task<PlayerProfileOutput?> GetProfileAsync(string playerId);

    /// <summary>
    /// 更新玩家档案（昵称、头像等可编辑信息）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">更新玩家档案请求参数（包含昵称、头像 URL 等）</param>
    /// <returns>更新后的玩家档案详情，若失败则返回 null</returns>
    Task<PlayerProfileOutput?> UpdateProfileAsync(string playerId, UpdatePlayerInput input);

    /// <summary>
    /// 获取战斗力排行榜前 N 名玩家
    /// </summary>
    /// <param name="top">排行榜返回前几名数量</param>
    /// <param name="sortBy">排序字段：power=战斗力降序、level=等级降序、score=积分降序（默认 power）</param>
    /// <returns>按指定字段降序排列的玩家列表（含在线状态、PK胜率、关卡信息）</returns>
    Task<List<LeaderboardEntryOutput>> GetLeaderboardAsync(int top, string sortBy = "power");

    /// <summary>
    /// 更新玩家统计信息（客户端上报战斗力、当前关卡最大关卡）
    /// </summary>
    /// <param name="playerId">玩家ID</param>
    /// <param name="input">更新参数（Power/MaxStage，可选）</param>
    /// <returns>更新后玩家档案输出，玩家不存在返回 null</returns>
    Task<PlayerProfileOutput?> UpdateStatsAsync(string playerId, UpdatePlayerStatsInput input);
}
