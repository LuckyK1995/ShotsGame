using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Codex;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 图鉴控制器：负责玩家图鉴总览查询与图鉴条目解锁更新
/// </summary>
[ApiController]
[Route("api/codex")]
[Authorize]
public class CodexController : AppControllerBase
{
    private readonly ICodexService _codexService;

    public CodexController(ICodexService codexService)
    {
        _codexService = codexService;
    }

    /// <summary>
    /// 获取当前玩家完整图鉴总览（含已解锁和未解锁条目）
    /// </summary>
    /// <returns>图鉴总览 CodexOutput（各类别图鉴条目及解锁状态）</returns>
    [HttpGet("all")]
    public async Task<IActionResult> GetCodexAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<CodexOutput>();
        }

        var codex = await _codexService.GetCodexAsync(playerId);
        if (codex == null)
        {
            return NotFoundFail<CodexOutput>("图鉴不存在");
        }

        return Success(codex, "获取图鉴成功");
    }

    /// <summary>
    /// 更新图鉴条目解锁进度（战斗结算或内部开发调试用）
    /// </summary>
    /// <param name="input">图鉴更新参数，包含条目类型、条目 ID 与解锁进度</param>
    /// <returns>更新后图鉴条目详情 CodexEntryOutput</returns>
    [HttpPost("update")]
    public async Task<IActionResult> UpdateEntryAsync(UpdateCodexInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<CodexEntryOutput>();
        }

        var result = await _codexService.UpdateEntryAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<CodexEntryOutput>("图鉴条目不存在或更新失败");
        }

        return Success(result, "更新成功");
    }
}
