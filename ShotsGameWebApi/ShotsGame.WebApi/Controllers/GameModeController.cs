using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameModeNs = ShotsGame.Core.DTOs.GameMode;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 游戏模式控制器：负责游戏模式列表查询、开始匹配游戏与材料副本列表查询
/// </summary>
[ApiController]
[Route("api/game-mode")]
[Authorize]
public class GameModeController : AppControllerBase
{
    private readonly IGameModeService _gameModeService;

    public GameModeController(IGameModeService gameModeService)
    {
        _gameModeService = gameModeService;
    }

    /// <summary>
    /// 获取玩家可参与的全部游戏模式列表（含解锁状态、模式描述）
    /// </summary>
    /// <returns>游戏模式列表 GameModeListOutput</returns>
    [HttpGet("modes")]
    public async Task<IActionResult> GetGameModesAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<GameModeNs.GameModeListOutput>();
        }

        var result = await _gameModeService.GetGameModesAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<GameModeNs.GameModeListOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 按指定游戏模式开始匹配并进入对局
    /// </summary>
    /// <param name="input">开始游戏参数，包含目标游戏模式及难度等</param>
    /// <returns>对局开始结果 StartGameOutput（含对局 ID、初始配置等）</returns>
    [HttpPost("start")]
    public async Task<IActionResult> StartGameAsync(GameModeNs.StartGameInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<GameModeNs.StartGameOutput>();
        }

        if (!Enum.IsDefined(typeof(ShotsGame.Core.Enums.GameMode), input.Mode))
        {
            return InvalidParamFail<GameModeNs.StartGameOutput>("游戏模式参数错误");
        }

        var result = await _gameModeService.StartGameAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<GameModeNs.StartGameOutput>("模式未解锁或玩家不存在");
        }

        return Success(result, "开始成功");
    }

    /// <summary>
    /// 获取当前玩家可挑战的材料副本列表
    /// </summary>
    /// <returns>材料副本列表 MaterialDungeonListOutput（含副本难度、掉落预览等）</returns>
    [HttpGet("material-dungeons")]
    public async Task<IActionResult> GetMaterialDungeonsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<GameModeNs.MaterialDungeonListOutput>();
        }

        var result = await _gameModeService.GetMaterialDungeonsAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<GameModeNs.MaterialDungeonListOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }
}
