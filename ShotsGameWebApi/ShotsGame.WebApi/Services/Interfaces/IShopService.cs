using ShotsGame.Core.DTOs.Shop;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 商店服务接口，负责商店商品查询、商品购买与商店刷新等业务
/// </summary>
public interface IShopService
{
    /// <summary>
    /// 获取当前波次对应的商店商品列表
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="currentWave">当前游戏波次（影响商店内容刷新）</param>
    /// <returns>商店商品列表与限购状态，若失败则返回 null</returns>
    Task<ShopOutput?> GetShopAsync(string playerId, int currentWave = 1);

    /// <summary>
    /// 购买指定商店商品并扣除货币
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">购买商品请求参数（包含商品 ID、购买数量）</param>
    /// <returns>购买结果与获得商品详情，若失败则返回 null</returns>
    Task<ShopItemOutput?> BuyItemAsync(string playerId, BuyShopItemInput input);

    /// <summary>
    /// 刷新商店商品（消耗刷新货币或刷新次数）
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="currentWave">当前游戏波次（影响刷新后内容）</param>
    /// <returns>刷新结果与新商品列表，若失败则返回 null</returns>
    Task<RefreshShopOutput?> RefreshShopAsync(string playerId, int currentWave = 1);
}
