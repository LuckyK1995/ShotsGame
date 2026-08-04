using ShotsGame.Core.DTOs.Lottery;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 水果机（老虎机）服务接口，负责押注、旋转、每日硬币发放等业务
/// </summary>
public interface ILotteryService
{
    /// <summary>
    /// 获取玩家当前水果机状态（余额、已押注、赔付线配置等）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>水果机当前状态信息，若失败则返回 null</returns>
    Task<LotteryOutput?> GetLotteryStatusAsync(string playerId);

    /// <summary>
    /// 每日首次进入时发放免费游戏硬币
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>发放结果与新增硬币数，若失败则返回 null</returns>
    Task<GiveDailyCoinsOutput?> GiveDailyCoinsAsync(string playerId);

    /// <summary>
    /// 对单条赔付线进行单笔押注
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">单笔押注请求参数（包含赔付线、下注金额）</param>
    /// <returns>更新后的水果机状态与押注信息，若失败则返回 null</returns>
    Task<LotteryOutput?> PlaceBetAsync(string playerId, PlaceBetInput input);

    /// <summary>
    /// 批量对多条赔付线进行押注
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">批量押注请求参数（包含多条押注配置）</param>
    /// <returns>更新后的水果机状态与押注信息，若失败则返回 null</returns>
    Task<LotteryOutput?> PlaceBetsBatchAsync(string playerId, PlaceBetsBatchInput input);

    /// <summary>
    /// 取消指定赔付线上的押注
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">取消押注请求参数（包含赔付线索引）</param>
    /// <returns>更新后的水果机状态与剩余押注，若失败则返回 null</returns>
    Task<LotteryOutput?> CancelBetAsync(string playerId, CancelBetInput input);

    /// <summary>
    /// 清空玩家在当前水果机上的所有押注
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>清空押注结果与退还金额，若失败则返回 null</returns>
    Task<ClearBetsOutput?> ClearBetsAsync(string playerId);

    /// <summary>
    /// 执行水果机旋转，判定中奖线并结算奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>旋转结果（停止图案、中奖线、奖励金额），若失败则返回 null</returns>
    Task<SpinOutput?> SpinAsync(string playerId);
}
