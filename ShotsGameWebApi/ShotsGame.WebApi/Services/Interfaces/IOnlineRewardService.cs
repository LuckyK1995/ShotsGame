using ShotsGame.Core.DTOs.OnlineReward;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 在线奖励服务接口，负责玩家在线时长统计与阶梯奖励领取等业务
/// </summary>
public interface IOnlineRewardService
{
    /// <summary>
    /// 获取玩家当前在线奖励状态（在线时长、各档位领取情况）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="currentOnlineMinutes">本次会话累计在线分钟数</param>
    /// <returns>在线奖励状态与档位详情，若失败则返回 null</returns>
    Task<OnlineRewardOutput?> GetStatusAsync(string playerId, int currentOnlineMinutes);

    /// <summary>
    /// 领取指定档位的在线奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="tier">奖励档位索引（从 1 开始）</param>
    /// <returns>奖励领取结果与获得物品，若失败则返回 null</returns>
    Task<ClaimOnlineRewardOutput?> ClaimRewardAsync(string playerId, int tier);
}
