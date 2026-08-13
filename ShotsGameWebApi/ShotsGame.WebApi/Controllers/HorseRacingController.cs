using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.HorseRacing;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 赛马控制器：负责赛会创建/查询、赛马下注/取消下注、开赛与结果查询
/// </summary>
[ApiController]
[Route("api/horse-racing")]
[Authorize]
public class HorseRacingController : AppControllerBase
{
    private readonly IHorseRacingService _horseRacingService;

    public HorseRacingController(IHorseRacingService horseRacingService)
    {
        _horseRacingService = horseRacingService;
    }

    /// <summary>
    /// 创建新的赛马会，随机生成参赛马匹与赔率信息
    /// </summary>
    /// <returns>新赛会信息 RaceSessionOutput（含马匹列表、赔率、下注截止时间）</returns>
    [HttpPost("create-session")]
    public async Task<IActionResult> CreateSessionAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<RaceSessionOutput>();
        }

        var result = await _horseRacingService.CreateSessionAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<RaceSessionOutput>("玩家不存在");
        }

        return Success(result, "创建赛会成功");
    }

    /// <summary>
    /// 根据赛会 ID 获取当前赛会详细信息
    /// </summary>
    /// <param name="sessionId">目标赛会唯一标识 ID</param>
    /// <returns>赛会详情 RaceSessionOutput（含马匹、赔率、下注状态）</returns>
    [HttpGet("session/{sessionId}")]
    public async Task<IActionResult> GetSessionAsync(string sessionId)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<RaceSessionOutput>();
        }

        if (string.IsNullOrEmpty(sessionId))
        {
            return InvalidParamFail<RaceSessionOutput>("赛会ID不能为空");
        }

        var result = await _horseRacingService.GetSessionAsync(playerId, sessionId);
        if (result == null)
        {
            return NotFoundFail<RaceSessionOutput>("赛会不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 对指定赛会中的某匹马进行下注
    /// </summary>
    /// <param name="sessionId">目标赛会唯一标识 ID</param>
    /// <param name="input">下注参数，包含马匹 ID 与下注金币数量</param>
    /// <returns>更新后的赛会信息 RaceSessionOutput（含玩家下注记录）</returns>
    [HttpPost("session/{sessionId}/bet")]
    public async Task<IActionResult> PlaceBetAsync(string sessionId, [FromBody] PlaceHorseBetInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<RaceSessionOutput>();
        }

        if (string.IsNullOrEmpty(sessionId))
        {
            return InvalidParamFail<RaceSessionOutput>("赛会ID不能为空");
        }

        if (input.HorseId <= 0 || input.Amount <= 0)
        {
            return InvalidParamFail<RaceSessionOutput>("下注参数错误");
        }

        var result = await _horseRacingService.PlaceBetAsync(playerId, sessionId, input);
        if (result == null)
        {
            return NotFoundFail<RaceSessionOutput>("赛会不存在或下注失败");
        }

        return Success(result, "下注成功");
    }

    /// <summary>
    /// 取消对指定赛会中某匹马的下注，返还下注金币
    /// </summary>
    /// <param name="sessionId">目标赛会唯一标识 ID</param>
    /// <param name="input">取消下注参数，包含目标马匹 ID</param>
    /// <returns>更新后的赛会信息 RaceSessionOutput（含玩家下注记录）</returns>
    [HttpPost("session/{sessionId}/cancel-bet")]
    public async Task<IActionResult> CancelBetAsync(string sessionId, [FromBody] CancelHorseBetInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<RaceSessionOutput>();
        }

        if (string.IsNullOrEmpty(sessionId))
        {
            return InvalidParamFail<RaceSessionOutput>("赛会ID不能为空");
        }

        if (input.HorseId <= 0)
        {
            return InvalidParamFail<RaceSessionOutput>("取消下注参数错误");
        }

        var result = await _horseRacingService.CancelBetAsync(playerId, sessionId, input);
        if (result == null)
        {
            return NotFoundFail<RaceSessionOutput>("赛会不存在或取消下注失败");
        }

        return Success(result, "取消下注成功");
    }

    /// <summary>
    /// 开始指定赛会的赛马比赛，结算比赛结果
    /// </summary>
    /// <param name="sessionId">目标赛会唯一标识 ID</param>
    /// <returns>比赛开始与结算结果 StartRaceOutput（含各马匹名次、中奖信息）</returns>
    [HttpPost("session/{sessionId}/start")]
    public async Task<IActionResult> StartRaceAsync(string sessionId)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<StartRaceOutput>();
        }

        if (string.IsNullOrEmpty(sessionId))
        {
            return InvalidParamFail<StartRaceOutput>("赛会ID不能为空");
        }

        var result = await _horseRacingService.StartRaceAsync(playerId, sessionId);
        if (result == null)
        {
            return NotFoundFail<StartRaceOutput>("赛会不存在或无法开始");
        }

        return Success(result, "比赛开始");
    }

    /// <summary>
    /// 查询指定赛会的比赛最终结果与玩家盈亏情况
    /// </summary>
    /// <param name="sessionId">目标赛会唯一标识 ID</param>
    /// <returns>比赛结果 RaceResultOutput（含马匹排名、玩家胜负金币等）</returns>
    [HttpGet("session/{sessionId}/result")]
    public async Task<IActionResult> GetRaceResultAsync(string sessionId)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<RaceResultOutput>();
        }

        if (string.IsNullOrEmpty(sessionId))
        {
            return InvalidParamFail<RaceResultOutput>("赛会ID不能为空");
        }

        var result = await _horseRacingService.GetRaceResultAsync(playerId, sessionId);
        if (result == null)
        {
            return NotFoundFail<RaceResultOutput>("比赛结果不存在");
        }

        return Success(result, "获取成功");
    }
}
