using ShotsGame.Core.DTOs.Calculate;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 数值计算服务接口，负责玩家属性、战斗力、经验进度与金币收益等数值计算业务
/// </summary>
public interface ICalculateService
{
    /// <summary>
    /// 计算玩家的完整属性面板（包含基础属性、装备加成、天赋加成、技能加成等）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>玩家完整属性计算结果，若失败则返回 null</returns>
    Task<PlayerStatsOutput?> CalculatePlayerStatsAsync(string playerId);

    /// <summary>
    /// 根据玩家属性计算战斗力数值
    /// </summary>
    /// <param name="stats">玩家属性面板数据</param>
    /// <returns>战斗力总数值</returns>
    Task<long> CalculatePowerAsync(PlayerStatsOutput stats);

    /// <summary>
    /// 计算玩家当前等级的经验进度与升级所需经验
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>经验进度计算结果（当前经验、升级所需、等级等），若失败则返回 null</returns>
    Task<ExpCalculationOutput?> CalculateExpAsync(string playerId);

    /// <summary>
    /// 根据战斗配置与难度计算金币收益
    /// </summary>
    /// <param name="input">金币计算请求参数（包含难度、波次、击杀数等）</param>
    /// <returns>金币收益计算结果，若失败则返回 null</returns>
    Task<GoldCalculationOutput?> CalculateGoldAsync(GoldCalculationInput input);
}
