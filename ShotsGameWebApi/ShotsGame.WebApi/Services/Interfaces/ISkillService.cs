using ShotsGame.Core.DTOs.Skill;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 技能服务接口，负责技能树查询、技能升级与降级等业务
/// </summary>
public interface ISkillService
{
    /// <summary>
    /// 获取玩家完整技能树（含所有技能节点、当前等级、解锁状态）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>技能树结构与各节点详情，若失败则返回 null</returns>
    Task<SkillTreeOutput?> GetSkillTreeAsync(string playerId);

    /// <summary>
    /// 消耗技能点升级指定技能
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">技能升级请求参数（包含技能 ID、升级等级）</param>
    /// <returns>升级后的技能详情，若失败则返回 null</returns>
    Task<SkillOutput?> UpgradeSkillAsync(string playerId, UpgradeSkillInput input);

    /// <summary>
    /// 降级指定技能并返还技能点
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">技能降级请求参数（包含技能 ID、降级等级）</param>
    /// <returns>降级后的技能详情，若失败则返回 null</returns>
    Task<SkillOutput?> DowngradeSkillAsync(string playerId, DowngradeSkillInput input);
}
