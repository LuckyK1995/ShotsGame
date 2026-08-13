using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 背包控制器：负责玩家背包/仓库物品查询、添加物品、移除物品与批量出售物品
/// </summary>
[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController : AppControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    /// <summary>
    /// 获取玩家完整背包与仓库中的全部物品清单
    /// </summary>
    /// <returns>背包物品列表 InventoryOutput（含背包各槽位物品及数量）</returns>
    [HttpGet("all")]
    public async Task<IActionResult> GetInventoryAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<InventoryOutput>();
        }

        var result = await _inventoryService.GetInventoryAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<InventoryOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 向玩家背包添加指定数量物品（GM/开发调试用接口）
    /// </summary>
    /// <param name="input">添加物品参数，包含物品 ID 和添加数量</param>
    /// <returns>添加后物品堆叠详情 ItemStackOutput</returns>
    [HttpPost("add")]
    public async Task<IActionResult> AddItemAsync([FromBody] AddItemInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ItemStackOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.ItemId))
        {
            return InvalidParamFail<ItemStackOutput>("物品ID不能为空");
        }

        if (input.Count <= 0)
        {
            return InvalidParamFail<ItemStackOutput>("物品数量必须大于0");
        }

        var result = await _inventoryService.AddItemAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<ItemStackOutput>("玩家不存在或添加失败");
        }

        return Success(result, "添加成功");
    }

    /// <summary>
    /// 从玩家背包移除指定数量物品
    /// </summary>
    /// <param name="input">移除物品参数，包含物品 ID 和移除数量</param>
    /// <returns>移除后物品堆叠详情 ItemStackOutput</returns>
    [HttpPost("remove")]
    public async Task<IActionResult> RemoveItemAsync([FromBody] RemoveItemInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ItemStackOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.ItemId))
        {
            return InvalidParamFail<ItemStackOutput>("物品ID不能为空");
        }

        if (input.Count <= 0)
        {
            return InvalidParamFail<ItemStackOutput>("物品数量必须大于0");
        }

        var result = await _inventoryService.RemoveItemAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<ItemStackOutput>("物品不存在或数量不足");
        }

        return Success(result, "移除成功");
    }

    /// <summary>
    /// 批量出售背包中指定物品，换取金币收益
    /// </summary>
    /// <param name="input">出售物品参数，包含待出售物品 ID 列表及对应数量</param>
    /// <returns>出售结果 SellItemsOutput（含获得金币总收益）</returns>
    [HttpPost("sell")]
    public async Task<IActionResult> SellItemsAsync([FromBody] SellItemsInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SellItemsOutput>();
        }

        if (input == null || input.Items == null || input.Items.Count == 0)
        {
            return InvalidParamFail<SellItemsOutput>("出售物品列表不能为空");
        }

        var result = await _inventoryService.SellItemsAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<SellItemsOutput>("出售失败");
        }

        return Success(result, "出售成功");
    }
}
