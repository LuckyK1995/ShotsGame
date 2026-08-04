using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Lottery;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 水果机控制器：负责水果机状态查询、每日硬币发放、各类押注操作与旋转开奖
/// </summary>
[ApiController]
[Route("api/lottery")]
[Authorize]
public class LotteryController : AppControllerBase
{
    private readonly ILotteryService _lotteryService;

    public LotteryController(ILotteryService lotteryService)
    {
        _lotteryService = lotteryService;
    }

    /// <summary>
    /// 获取当前水果机实时状态（硬币余额、当前押注、历史最高奖等）
    /// </summary>
    /// <returns>水果机状态 LotteryOutput</returns>
    [HttpGet("status")]
    public async Task<IActionResult> GetLotteryStatusAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<LotteryOutput>();
        }

        var result = await _lotteryService.GetLotteryStatusAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<LotteryOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 为玩家发放每日免费水果机硬币（每日限一次）
    /// </summary>
    /// <returns>发放结果 GiveDailyCoinsOutput（含发放数量及新硬币余额）</returns>
    [HttpPost("give-daily-coins")]
    public async Task<IActionResult> GiveDailyCoinsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<GiveDailyCoinsOutput>();
        }

        var result = await _lotteryService.GiveDailyCoinsAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<GiveDailyCoinsOutput>("玩家不存在");
        }

        return Success(result, "发放成功");
    }

    /// <summary>
    /// 对水果机单个赔率项进行单笔押注
    /// </summary>
    /// <param name="input">押注参数，包含赔率类别和押注硬币数量</param>
    /// <returns>更新后的水果机状态 LotteryOutput</returns>
    [HttpPost("place-bet")]
    public async Task<IActionResult> PlaceBetAsync(PlaceBetInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<LotteryOutput>();
        }

        if (string.IsNullOrEmpty(input.Category) || input.Amount <= 0)
        {
            return InvalidParamFail<LotteryOutput>("押注参数错误");
        }

        var result = await _lotteryService.PlaceBetAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<LotteryOutput>("玩家不存在");
        }

        return Success(result, "押注成功");
    }

    /// <summary>
    /// 对水果机多个赔率项进行批量押注
    /// </summary>
    /// <param name="input">批量押注参数，包含多笔赔率类别与对应押注数量</param>
    /// <returns>更新后的水果机状态 LotteryOutput</returns>
    [HttpPost("place-bets-batch")]
    public async Task<IActionResult> PlaceBetsBatchAsync(PlaceBetsBatchInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<LotteryOutput>();
        }

        if (input.Bets == null || input.Bets.Count == 0)
        {
            return InvalidParamFail<LotteryOutput>("押注列表不能为空");
        }

        var result = await _lotteryService.PlaceBetsBatchAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<LotteryOutput>("玩家不存在");
        }

        return Success(result, "批量押注成功");
    }

    /// <summary>
    /// 取消对水果机指定赔率项的押注，返还对应硬币
    /// </summary>
    /// <param name="input">取消押注参数，包含目标赔率类别</param>
    /// <returns>更新后的水果机状态 LotteryOutput</returns>
    [HttpPost("cancel-bet")]
    public async Task<IActionResult> CancelBetAsync(CancelBetInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<LotteryOutput>();
        }

        if (string.IsNullOrEmpty(input.Category))
        {
            return InvalidParamFail<LotteryOutput>("取消押注参数错误");
        }

        var result = await _lotteryService.CancelBetAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<LotteryOutput>("玩家不存在");
        }

        return Success(result, "取消押注成功");
    }

    /// <summary>
    /// 清空水果机当前全部押注，一次性返还所有已押硬币
    /// </summary>
    /// <returns>清空押注结果 ClearBetsOutput（含返还硬币总数）</returns>
    [HttpPost("clear-bets")]
    public async Task<IActionResult> ClearBetsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ClearBetsOutput>();
        }

        var result = await _lotteryService.ClearBetsAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<ClearBetsOutput>("玩家不存在");
        }

        return Success(result, "清空押注成功");
    }

    /// <summary>
    /// 旋转水果机进行开奖，根据押注和结果计算盈亏
    /// </summary>
    /// <returns>旋转开奖结果 SpinOutput（含三列图案、中奖线及盈亏硬币数）</returns>
    [HttpPost("spin")]
    public async Task<IActionResult> SpinAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SpinOutput>();
        }

        var result = await _lotteryService.SpinAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<SpinOutput>("玩家不存在或押注不足");
        }

        return Success(result, "旋转成功");
    }
}
