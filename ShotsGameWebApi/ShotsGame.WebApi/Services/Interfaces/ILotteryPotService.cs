using ShotsGame.Core.DTOs.LotteryPot;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 抽奖罐服务接口，负责抽奖罐累计进度查询与消耗使用等业务
/// </summary>
public interface ILotteryPotService
{
    /// <summary>
    /// 获取玩家当前抽奖罐的累计进度与奖励档位信息
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>抽奖罐状态与各档位详情，若失败则返回 null</returns>
    Task<LotteryPotOutput?> GetStatusAsync(string playerId);

    /// <summary>
    /// 消耗抽奖罐累计次数进行抽奖，随机获得对应档位奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">使用抽奖罐请求参数（包含抽取次数）</param>
    /// <returns>抽奖结果与获得物品列表，若失败则返回 null</returns>
    Task<UseLotteryPotOutput?> UsePotAsync(string playerId, UseLotteryPotInput input);
}
