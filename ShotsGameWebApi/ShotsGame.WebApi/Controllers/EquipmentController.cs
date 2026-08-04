using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Enhance;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 装备控制器：负责装备查询、穿戴/卸下、强化、附魔、宝石镶嵌、装备分解与强化等级转移
/// </summary>
[ApiController]
[Route("api/equipment")]
[Authorize]
public class EquipmentController : AppControllerBase
{
    private readonly IEquipmentService _equipmentService;

    public EquipmentController(IEquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    /// <summary>
    /// 获取当前玩家已穿戴的全部装备列表
    /// </summary>
    /// <returns>已装备装备列表 List&lt;EquipmentOutput&gt;</returns>
    [HttpGet("equipped")]
    public async Task<IActionResult> GetEquippedItemsAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<List<EquipmentOutput>>();
        }

        var result = await _equipmentService.GetEquippedItemsAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<List<EquipmentOutput>>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 获取当前玩家装备仓库（未穿戴装备）列表
    /// </summary>
    /// <returns>仓库中装备列表 List&lt;EquipmentOutput&gt;</returns>
    [HttpGet("storage")]
    public async Task<IActionResult> GetEquipmentStorageAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<List<EquipmentOutput>>();
        }

        var result = await _equipmentService.GetEquipmentStorageAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<List<EquipmentOutput>>("玩家不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 根据装备 ID 获取单件装备的详细属性
    /// </summary>
    /// <param name="id">装备唯一标识 ID</param>
    /// <returns>单件装备详情 EquipmentOutput</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEquipmentAsync(string id)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<EquipmentOutput>();
        }

        if (string.IsNullOrEmpty(id))
        {
            return InvalidParamFail<EquipmentOutput>("装备ID不能为空");
        }

        var result = await _equipmentService.GetEquipmentAsync(playerId, id);
        if (result == null)
        {
            return NotFoundFail<EquipmentOutput>("装备不存在");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 将指定装备穿戴到对应部位（替换同槽位旧装备）
    /// </summary>
    /// <param name="input">装备参数，包含装备 ID 和目标装备槽位</param>
    /// <returns>穿戴后的装备详情 EquipmentOutput</returns>
    [HttpPost("equip")]
    public async Task<IActionResult> EquipItemAsync(EquipItemInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<EquipmentOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.EquipmentId))
        {
            return InvalidParamFail<EquipmentOutput>("装备ID不能为空");
        }

        var result = await _equipmentService.EquipItemAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<EquipmentOutput>("装备不存在或无法装备");
        }

        return Success(result, "装备成功");
    }

    /// <summary>
    /// 将指定装备从角色身上卸下并放回装备仓库
    /// </summary>
    /// <param name="input">卸下装备参数，包含装备 ID 和装备槽位</param>
    /// <returns>卸下后的装备详情 EquipmentOutput</returns>
    [HttpPost("unequip")]
    public async Task<IActionResult> UnequipItemAsync(UnequipItemInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<EquipmentOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.EquipmentId))
        {
            return InvalidParamFail<EquipmentOutput>("装备ID不能为空");
        }

        var result = await _equipmentService.UnequipItemAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<EquipmentOutput>("装备不存在或未装备");
        }

        return Success(result, "卸下成功");
    }

    /// <summary>
    /// 按指定稀有度/槽位/等级随机生成一件装备（管理员/开发调试用）
    /// </summary>
    /// <param name="input">生成参数，包含装备槽位、稀有度、等级等条件</param>
    /// <returns>新生成的装备详情 EquipmentOutput</returns>
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateEquipmentAsync(GenerateEquipmentInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<EquipmentOutput>();
        }

        if (input == null)
        {
            return InvalidParamFail<EquipmentOutput>("参数不能为空");
        }

        var result = await _equipmentService.GenerateEquipmentAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<EquipmentOutput>("玩家不存在或生成失败");
        }

        return Success(result, "生成成功");
    }

    /// <summary>
    /// 对指定装备进行强化，有概率提升装备强化等级与基础属性
    /// </summary>
    /// <param name="input">强化参数，包含装备 ID 和强化模式（普通/保底等）</param>
    /// <returns>强化结果 EnhanceResultOutput（含是否成功、强化前后等级、消耗材料等）</returns>
    [HttpPost("enhance")]
    public async Task<IActionResult> EnhanceEquipmentAsync(EnhanceEquipmentInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<EnhanceResultOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.EquipmentId))
        {
            return InvalidParamFail<EnhanceResultOutput>("装备ID不能为空");
        }

        var result = await _equipmentService.EnhanceEquipmentAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<EnhanceResultOutput>("装备不存在或强化失败");
        }

        return Success(result, result.Success ? "强化成功" : "强化失败");
    }

    /// <summary>
    /// 为装备附加附魔属性，消耗指定附魔物品
    /// </summary>
    /// <param name="input">附魔参数，包含装备 ID 和附魔物品 ID</param>
    /// <returns>附魔结果 EnchantResultOutput（含新附魔属性及消耗信息）</returns>
    [HttpPost("enchant")]
    public async Task<IActionResult> EnchantEquipmentAsync(EnchantEquipmentInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<EnchantResultOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.EquipmentId) || string.IsNullOrEmpty(input.EnchantItemId))
        {
            return InvalidParamFail<EnchantResultOutput>("装备ID和附魔物品ID不能为空");
        }

        var result = await _equipmentService.EnchantEquipmentAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<EnchantResultOutput>("装备或附魔物品不存在");
        }

        return Success(result, "附魔成功");
    }

    /// <summary>
    /// 为装备的宝石孔位镶嵌指定宝石，提供对应属性加成
    /// </summary>
    /// <param name="input">宝石镶嵌参数，包含装备 ID、宝石物品 ID 与目标孔位</param>
    /// <returns>镶嵌结果 GemSocketResultOutput（含是否成功及镶嵌后装备属性）</returns>
    [HttpPost("socket-gem")]
    public async Task<IActionResult> SocketGemAsync(SocketGemInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<GemSocketResultOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.EquipmentId) || string.IsNullOrEmpty(input.GemItemId))
        {
            return InvalidParamFail<GemSocketResultOutput>("装备ID和宝石物品ID不能为空");
        }

        var result = await _equipmentService.SocketGemAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<GemSocketResultOutput>("装备或宝石不存在");
        }

        return Success(result, result.Success ? "镶嵌成功" : "镶嵌失败");
    }

    /// <summary>
    /// 批量分解指定装备，回收获得金币与强化材料
    /// </summary>
    /// <param name="input">分解参数，包含待分解装备 ID 列表</param>
    /// <returns>分解结果 SellItemsOutput（含获得金币、材料等收益）</returns>
    [HttpPost("decompose")]
    public async Task<IActionResult> DecomposeEquipmentAsync(DecomposeEquipmentInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SellItemsOutput>();
        }

        if (input == null || input.EquipmentIds == null || input.EquipmentIds.Length == 0)
        {
            return InvalidParamFail<SellItemsOutput>("装备ID列表不能为空");
        }

        var result = await _equipmentService.DecomposeEquipmentAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<SellItemsOutput>("分解失败");
        }

        return Success(result, "分解成功");
    }

    /// <summary>
    /// 将源装备的强化等级转移到目标装备上（消耗转移材料）
    /// </summary>
    /// <param name="input">强化转移参数，包含源装备 ID 和目标装备 ID</param>
    /// <returns>转移结果 EnhanceResultOutput（含转移后装备强化等级）</returns>
    [HttpPost("transfer-enhance")]
    public async Task<IActionResult> TransferEnhanceAsync(TransferEnhanceInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<EnhanceResultOutput>();
        }

        if (input == null || string.IsNullOrEmpty(input.FromEquipmentId) || string.IsNullOrEmpty(input.ToEquipmentId))
        {
            return InvalidParamFail<EnhanceResultOutput>("源装备ID和目标装备ID不能为空");
        }

        var result = await _equipmentService.TransferEnhanceAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<EnhanceResultOutput>("装备不存在或转移失败");
        }

        return Success(result, "转移成功");
    }
}
