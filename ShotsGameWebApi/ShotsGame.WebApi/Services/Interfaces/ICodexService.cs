using ShotsGame.Core.DTOs.Codex;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 图鉴服务接口，负责图鉴总览查询与条目解锁更新等业务
/// </summary>
public interface ICodexService
{
    /// <summary>
    /// 获取玩家图鉴总览（分类统计、解锁进度、条目列表）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>图鉴总览数据与解锁进度，若失败则返回 null</returns>
    Task<CodexOutput?> GetCodexAsync(string playerId);

    /// <summary>
    /// 更新图鉴中指定条目的解锁状态或进度
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">更新图鉴请求参数（包含条目类型、条目 ID、进度增量）</param>
    /// <returns>更新后的图鉴条目详情，若失败则返回 null</returns>
    Task<CodexEntryOutput?> UpdateEntryAsync(string playerId, UpdateCodexInput input);
}
