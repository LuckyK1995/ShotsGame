using ShotsGame.Core.DTOs.Achievement;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 成就服务接口，负责成就列表查询、成就奖励领取与成就进度更新等业务
/// </summary>
public interface IAchievementService
{
    /// <summary>
    /// 获取玩家全部成就列表及各成就进度与领取状态
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>成就分类列表与进度详情，若失败则返回 null</returns>
    Task<AchievementListOutput?> GetAchievementsAsync(string playerId);

    /// <summary>
    /// 领取已达成成就的奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">领取成就奖励请求参数（包含成就 ID）</param>
    /// <returns>奖励领取结果与获得物品，若失败则返回 null</returns>
    Task<ClaimAchievementOutput?> ClaimAchievementAsync(string playerId, ClaimAchievementInput input);

    /// <summary>
    /// 更新指定成就的进度值（如击杀数、通关次数等计数型进度）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="achievementId">成就唯一标识</param>
    /// <param name="increment">进度增量值</param>
    /// <returns>更新是否成功</returns>
    Task<bool> UpdateProgressAsync(string playerId, string achievementId, int increment);
}
