using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Shop;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 商店控制器：负责根据波次获取随机商店、购买商品与手动刷新商店
/// </summary>
[ApiController]
[Route("api/shop")]
[Authorize]
public class ShopController : AppControllerBase
{
    private readonly IShopService _shopService;

    public ShopController(IShopService shopService)
    {
        _shopService = shopService;
    }

    /// <summary>
    /// 根据当前波次获取随机刷新的商店商品列表
    /// </summary>
    /// <param name="currentWave">当前游戏波次，用于商品稀有度计算，默认 1</param>
    /// <returns>商店内容 ShopOutput（含商品列表、刷新次数）</returns>
    [HttpGet]
    public async Task<IActionResult> GetShopAsync([FromQuery] int currentWave = 1)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ShopOutput>();
        }

        var shop = await _shopService.GetShopAsync(playerId, currentWave);
        if (shop == null)
        {
            return NotFoundFail<ShopOutput>("商店不存在");
        }

        return Success(shop, "获取商店成功");
    }

    /// <summary>
    /// 从当前商店购买指定商品，消耗对应货币
    /// </summary>
    /// <param name="input">购买参数，包含商店商品 ID 与购买数量</param>
    /// <returns>购买结果 ShopItemOutput（含购买后商品与扣减货币）</returns>
    [HttpPost("buy")]
    public async Task<IActionResult> BuyItemAsync([FromBody] BuyShopItemInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ShopItemOutput>();
        }

        var item = await _shopService.BuyItemAsync(playerId, input);
        if (item == null)
        {
            return NotFoundFail<ShopItemOutput>("商品不存在或购买失败");
        }

        return Success(item, "购买成功");
    }

    /// <summary>
    /// 手动刷新当前商店商品列表（消耗刷新次数或付费）
    /// </summary>
    /// <param name="currentWave">当前游戏波次，用于商品稀有度计算，默认 1</param>
    /// <returns>刷新后商店内容 RefreshShopOutput</returns>
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshShopAsync([FromQuery] int currentWave = 1)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<RefreshShopOutput>();
        }

        var result = await _shopService.RefreshShopAsync(playerId, currentWave);
        if (result == null)
        {
            return NotFoundFail<RefreshShopOutput>("商店不存在或刷新失败");
        }

        return Success(result, "刷新成功");
    }
}
