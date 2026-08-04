using ShotsGame.Core.DTOs.Enhance;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 强化合成服务接口，负责宝石合成与附魔书合成等业务
/// </summary>
public interface IEnhanceService
{
    /// <summary>
    /// 将多颗低级宝石合成为一颗高级宝石
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">宝石合成请求参数（包含待合成宝石列表与目标等级）</param>
    /// <returns>宝石合成结果详情，若失败则返回 null</returns>
    Task<MergeGemOutput?> MergeGemsAsync(string playerId, MergeGemInput input);

    /// <summary>
    /// 将多本低级附魔书合成为一本高级附魔书
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">附魔书合成请求参数（包含待合成附魔书列表）</param>
    /// <returns>附魔书合成结果详情，若失败则返回 null</returns>
    Task<MergeEnchantOutput?> MergeEnchantsAsync(string playerId, MergeEnchantInput input);
}
