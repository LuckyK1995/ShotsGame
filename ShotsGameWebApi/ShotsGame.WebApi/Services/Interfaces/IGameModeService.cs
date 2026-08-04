using GameModeNs = ShotsGame.Core.DTOs.GameMode;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 游戏模式服务接口，负责游戏模式列表获取、游戏开局与材料副本管理等业务
/// </summary>
public interface IGameModeService
{
    /// <summary>
    /// 获取玩家可用的游戏模式列表及解锁状态
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>游戏模式列表与解锁状态，若失败则返回 null</returns>
    Task<GameModeNs.GameModeListOutput?> GetGameModesAsync(string playerId);

    /// <summary>
    /// 选择指定游戏模式并开始一局游戏
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">开始游戏请求参数（包含模式 ID、难度、地图等）</param>
    /// <returns>开局结果与初始场景数据，若失败则返回 null</returns>
    Task<GameModeNs.StartGameOutput?> StartGameAsync(string playerId, GameModeNs.StartGameInput input);

    /// <summary>
    /// 获取材料副本列表及每日挑战次数
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>材料副本列表与剩余次数，若失败则返回 null</returns>
    Task<GameModeNs.MaterialDungeonListOutput?> GetMaterialDungeonsAsync(string playerId);
}
