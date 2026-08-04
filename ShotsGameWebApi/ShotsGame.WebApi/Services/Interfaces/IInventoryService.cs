using ShotsGame.Core.DTOs.Inventory;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 背包服务接口，负责玩家背包与仓库的物品增删、查询与批量出售等业务
/// </summary>
public interface IInventoryService
{
    /// <summary>
    /// 获取玩家背包与仓库的物品总览
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>背包与仓库物品列表及容量信息，若失败则返回 null</returns>
    Task<InventoryOutput?> GetInventoryAsync(string playerId);

    /// <summary>
    /// 向玩家背包中添加指定物品
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">添加物品请求参数（包含物品 ID、数量、来源等）</param>
    /// <returns>新增或更新后的物品堆信息，若失败则返回 null</returns>
    Task<ItemStackOutput?> AddItemAsync(string playerId, AddItemInput input);

    /// <summary>
    /// 从玩家背包中移除指定数量的物品
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">移除物品请求参数（包含物品 ID、数量）</param>
    /// <returns>移除后的物品堆信息，若失败则返回 null</returns>
    Task<ItemStackOutput?> RemoveItemAsync(string playerId, RemoveItemInput input);

    /// <summary>
    /// 批量出售背包中的物品换取金币
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">批量出售请求参数（包含待出售物品列表）</param>
    /// <returns>出售结果与获得金币总额，若失败则返回 null</returns>
    Task<SellItemsOutput?> SellItemsAsync(string playerId, SellItemsInput input);
}
