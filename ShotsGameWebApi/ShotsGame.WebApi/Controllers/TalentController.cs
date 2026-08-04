using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Talent;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 天赋控制器：负责战斗内/升级时的天赋三选一选择与已获得天赋列表查询
/// </summary>
[ApiController]
[Route("api/talent")]
[Authorize]
public class TalentController : AppControllerBase
{
    private readonly ITalentService _talentService;

    public TalentController(ITalentService talentService)
    {
        _talentService = talentService;
    }

    /// <summary>
    /// 获取当前玩家可选择的天赋三选一随机选项
    /// </summary>
    /// <returns>天赋三选一选项 TalentChoicesOutput（3 个随机天赋选项）</returns>
    [HttpGet("choices")]
    public async Task<IActionResult> GetTalentChoicesAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<TalentChoicesOutput>();
        }

        var result = await _talentService.GetTalentChoicesAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<TalentChoicesOutput>("玩家不存在或暂无可选天赋");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 获取当前玩家已选择/已拥有的全部天赋列表
    /// </summary>
    /// <returns>已拥有天赋列表 List&lt;TalentOutput&gt;</returns>
    [HttpGet("owned")]
    public async Task<IActionResult> GetOwnedTalentsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<List<TalentOutput>>();
        }

        var result = await _talentService.GetOwnedTalentsAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<List<TalentOutput>>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 从三选一选项中选择一个天赋并激活其效果
    /// </summary>
    /// <param name="input">选择参数，包含目标天赋 ID</param>
    /// <returns>已选择的天赋详情 TalentOutput</returns>
    [HttpPost("choose")]
    public async Task<IActionResult> ChooseTalentAsync(ChooseTalentInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<TalentOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.TalentId))
        {
            return InvalidParamFail<TalentOutput>("天赋ID不能为空");
        }

        var result = await _talentService.ChooseTalentAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<TalentOutput>("天赋不存在或选择失败");
        }

        return Success(result, "选择成功");
    }
}
