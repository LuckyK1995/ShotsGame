using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Skill;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 技能控制器：负责玩家技能树查询、技能点升级与技能降级返还技能点
/// </summary>
[ApiController]
[Route("api/skill")]
[Authorize]
public class SkillController : AppControllerBase
{
    private readonly ISkillService _skillService;

    public SkillController(ISkillService skillService)
    {
        _skillService = skillService;
    }

    /// <summary>
    /// 获取当前玩家完整技能树结构与技能学习进度
    /// </summary>
    /// <returns>技能树结构 SkillTreeOutput（含各分支、节点状态与可用技能点）</returns>
    [HttpGet("tree")]
    public async Task<IActionResult> GetSkillTreeAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SkillTreeOutput>();
        }

        var result = await _skillService.GetSkillTreeAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<SkillTreeOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 消耗技能点升级指定技能等级
    /// </summary>
    /// <param name="input">技能升级参数，包含目标技能 ID</param>
    /// <returns>升级后技能详情 SkillOutput</returns>
    [HttpPost("upgrade")]
    public async Task<IActionResult> UpgradeSkillAsync(UpgradeSkillInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SkillOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.SkillId))
        {
            return InvalidParamFail<SkillOutput>("技能ID不能为空");
        }

        var result = await _skillService.UpgradeSkillAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<SkillOutput>("技能不存在或升级失败");
        }

        return Success(result, "升级成功");
    }

    /// <summary>
    /// 降级指定技能等级，按比例返还技能点
    /// </summary>
    /// <param name="input">技能降级参数，包含目标技能 ID</param>
    /// <returns>降级后技能详情 SkillOutput（含返还的技能点）</returns>
    [HttpPost("downgrade")]
    public async Task<IActionResult> DowngradeSkillAsync(DowngradeSkillInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SkillOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.SkillId))
        {
            return InvalidParamFail<SkillOutput>("技能ID不能为空");
        }

        var result = await _skillService.DowngradeSkillAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<SkillOutput>("技能不存在或降级失败");
        }

        return Success(result, "降级成功");
    }
}
