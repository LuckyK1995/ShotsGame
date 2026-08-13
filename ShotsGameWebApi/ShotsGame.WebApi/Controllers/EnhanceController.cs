using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Enhance;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 强化控制器：负责同等级宝石合并升级、附魔书合并升级等合成类强化操作
/// </summary>
[ApiController]
[Route("api/enhance")]
[Authorize]
public class EnhanceController : AppControllerBase
{
    private readonly IEnhanceService _enhanceService;

    public EnhanceController(IEnhanceService enhanceService)
    {
        _enhanceService = enhanceService;
    }

    /// <summary>
    /// 合成宝石：将多颗同类型同等级低级宝石合并为一颗更高级宝石
    /// </summary>
    /// <param name="input">宝石合成参数，包含宝石类型、原稀有度、合成数量</param>
    /// <returns>合成结果 MergeGemOutput（含获得的高级宝石及消耗材料）</returns>
    [HttpPost("merge-gems")]
    public async Task<IActionResult> MergeGemsAsync([FromBody] MergeGemInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<MergeGemOutput>();
        }

        if (!Enum.IsDefined(typeof(ShotsGame.Core.Enums.GemType), input.GemType)
            || !Enum.IsDefined(typeof(ShotsGame.Core.Enums.GemRarity), input.FromRarity)
            || input.Count < 2)
        {
            return InvalidParamFail<MergeGemOutput>("宝石合成参数错误");
        }

        var result = await _enhanceService.MergeGemsAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<MergeGemOutput>("材料不足或玩家不存在");
        }

        return Success(result, "合成成功");
    }

    /// <summary>
    /// 合成附魔书：将多本同属性同稀有度的低级附魔书合并为一本高级附魔书
    /// </summary>
    /// <param name="input">附魔书合成参数，包含附魔属性类型、原稀有度、合成数量</param>
    /// <returns>合成结果 MergeEnchantOutput（含获得的高级附魔书及消耗材料）</returns>
    [HttpPost("merge-enchants")]
    public async Task<IActionResult> MergeEnchantsAsync([FromBody] MergeEnchantInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<MergeEnchantOutput>();
        }

        if (!Enum.IsDefined(typeof(ShotsGame.Core.Enums.EnchantStat), input.Stat)
            || !Enum.IsDefined(typeof(ShotsGame.Core.Enums.EquipRarity), input.FromRarity)
            || input.Count < 2)
        {
            return InvalidParamFail<MergeEnchantOutput>("附魔书合成参数错误");
        }

        var result = await _enhanceService.MergeEnchantsAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<MergeEnchantOutput>("材料不足或玩家不存在");
        }

        return Success(result, "合成成功");
    }
}
