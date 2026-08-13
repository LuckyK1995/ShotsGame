using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.LotteryPot;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 抽奖罐控制器：负责抽奖罐持有状态查询与批量使用抽奖罐开启奖励
/// </summary>
[ApiController]
[Route("api/lottery-pot")]
[Authorize]
public class LotteryPotController : AppControllerBase
{
    private readonly ILotteryPotService _lotteryPotService;

    public LotteryPotController(ILotteryPotService lotteryPotService)
    {
        _lotteryPotService = lotteryPotService;
    }

    /// <summary>
    /// 获取当前玩家持有的抽奖罐数量及奖池信息
    /// </summary>
    /// <returns>抽奖罐状态 LotteryPotOutput（含持有数量、奖池累计等）</returns>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatusAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<LotteryPotOutput>();
        }

        var result = await _lotteryPotService.GetStatusAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<LotteryPotOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 使用指定数量的抽奖罐开启随机奖励
    /// </summary>
    /// <param name="input">使用参数，包含开启抽奖罐的数量</param>
    /// <returns>使用结果 UseLotteryPotOutput（含获得的全部奖励物品）</returns>
    [HttpPost("use")]
    public async Task<IActionResult> UsePotAsync([FromBody] UseLotteryPotInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<UseLotteryPotOutput>();
        }

        if (input.Count <= 0)
        {
            return InvalidParamFail<UseLotteryPotOutput>("使用数量必须大于0");
        }

        var result = await _lotteryPotService.UsePotAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<UseLotteryPotOutput>("抽奖罐不足或玩家不存在");
        }

        return Success(result, "使用成功");
    }
}
