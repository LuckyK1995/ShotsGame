using ShotsGame.Core.DTOs.Talent;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 天赋服务接口，负责天赋抽取选项生成、已拥有天赋查询与天赋选择等业务
/// </summary>
public interface ITalentService
{
    /// <summary>
    /// 抽取三个随机天赋选项供玩家选择
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>三选一的天赋选项列表，若失败则返回 null</returns>
    Task<TalentChoicesOutput?> GetTalentChoicesAsync(string playerId);

    /// <summary>
    /// 获取玩家已拥有的全部天赋
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>已拥有天赋列表，若不存在则返回 null</returns>
    Task<List<TalentOutput>?> GetOwnedTalentsAsync(string playerId);

    /// <summary>
    /// 从三选一选项中选择一个天赋永久获得
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">选择天赋请求参数（包含天赋选择项 ID）</param>
    /// <returns>选择后的天赋详情，若失败则返回 null</returns>
    Task<TalentOutput?> ChooseTalentAsync(string playerId, ChooseTalentInput input);
}
