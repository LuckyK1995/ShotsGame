using ShotsGame.Core.DTOs.HorseRacing;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 赛马服务接口，负责赛会创建、下注管理、比赛开始与结果结算等业务
/// </summary>
public interface IHorseRacingService
{
    /// <summary>
    /// 创建一场新的赛马会，并生成参赛马匹数据
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>新赛会信息与参赛马匹列表，若失败则返回 null</returns>
    Task<RaceSessionOutput?> CreateSessionAsync(string playerId);

    /// <summary>
    /// 根据会话 ID 获取赛马会详情与当前下注状态
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="sessionId">赛会唯一标识</param>
    /// <returns>赛会详情与下注信息，若不存在则返回 null</returns>
    Task<RaceSessionOutput?> GetSessionAsync(string playerId, string sessionId);

    /// <summary>
    /// 对指定赛马会的马匹进行下注
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="sessionId">赛会唯一标识</param>
    /// <param name="input">下注请求参数（包含马匹编号、下注金额、下注类型）</param>
    /// <returns>更新后的赛会信息与当前下注，若失败则返回 null</returns>
    Task<RaceSessionOutput?> PlaceBetAsync(string playerId, string sessionId, PlaceHorseBetInput input);

    /// <summary>
    /// 取消玩家在指定赛会中的下注
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="sessionId">赛会唯一标识</param>
    /// <param name="input">取消下注请求参数（包含下注记录 ID）</param>
    /// <returns>更新后的赛会信息与剩余下注，若失败则返回 null</returns>
    Task<RaceSessionOutput?> CancelBetAsync(string playerId, string sessionId, CancelHorseBetInput input);

    /// <summary>
    /// 开始指定赛会的比赛，模拟比赛过程并产生排名
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="sessionId">赛会唯一标识</param>
    /// <returns>比赛过程数据与最终排名，若失败则返回 null</returns>
    Task<StartRaceOutput?> StartRaceAsync(string playerId, string sessionId);

    /// <summary>
    /// 获取指定赛会的最终比赛结果与奖励结算
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="sessionId">赛会唯一标识</param>
    /// <returns>比赛结果、中奖名单与奖励详情，若失败则返回 null</returns>
    Task<RaceResultOutput?> GetRaceResultAsync(string playerId, string sessionId);
}
