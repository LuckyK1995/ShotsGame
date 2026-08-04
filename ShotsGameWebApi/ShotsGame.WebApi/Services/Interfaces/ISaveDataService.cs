using ShotsGame.Core.DTOs.SaveData;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 存档服务接口，负责游戏存档的保存、读取、导出与重置等业务
/// </summary>
public interface ISaveDataService
{
    /// <summary>
    /// 保存玩家当前游戏进度为存档快照
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">存档内容输入（包含角色数据、背包、任务等）</param>
    /// <returns>保存结果与存档时间戳，若失败则返回 null</returns>
    Task<SaveGameOutput?> SaveGameAsync(string playerId, SaveGameInput input);

    /// <summary>
    /// 读取玩家最近一次保存的存档
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>加载的存档内容，若不存在存档则返回 null</returns>
    Task<LoadGameOutput?> LoadGameAsync(string playerId);

    /// <summary>
    /// 获取玩家完整的结构化存档数据（含所有关联实体）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>完整结构化存档数据，若失败则返回 null</returns>
    Task<FullSaveDataOutput?> GetFullSaveDataAsync(string playerId);

    /// <summary>
    /// 重置玩家所有存档数据（清空角色、背包、进度等）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>重置结果详情，若失败则返回 null</returns>
    Task<ResetSaveOutput?> ResetSaveAsync(string playerId);
}
