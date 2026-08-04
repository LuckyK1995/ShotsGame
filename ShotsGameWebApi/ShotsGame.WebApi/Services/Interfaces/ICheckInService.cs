using ShotsGame.Core.DTOs.CheckIn;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 签到服务接口，负责签到状态查询、本周奖励表获取与签到执行等业务
/// </summary>
public interface ICheckInService
{
    /// <summary>
    /// 获取玩家当前签到状态（已签到天数、今日是否已签等）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>签到状态详情，若失败则返回 null</returns>
    Task<CheckInOutput?> GetCheckInStatusAsync(string playerId);

    /// <summary>
    /// 获取本周签到奖励配置表与已领取情况
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>本周签到奖励列表与领取状态，若失败则返回 null</returns>
    Task<WeekRewardsOutput?> GetWeekRewardsAsync(string playerId);

    /// <summary>
    /// 执行每日签到，发放当日奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>签到结果与当日奖励详情，若失败则返回 null</returns>
    Task<DoCheckInOutput?> DoCheckInAsync(string playerId);
}
