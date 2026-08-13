using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.SaveData;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 存档控制器：负责玩家云存档保存、读取、结构化全量存档查询与危险重置操作
/// </summary>
[ApiController]
[Route("api/save-data")]
[Authorize]
public class SaveDataController : AppControllerBase
{
    private readonly ISaveDataService _saveDataService;
    private readonly ILogger<SaveDataController> _logger;

    public SaveDataController(ISaveDataService saveDataService, ILogger<SaveDataController> logger)
    {
        _saveDataService = saveDataService;
        _logger = logger;
    }

    /// <summary>
    /// 将玩家客户端游戏进度保存到云端存档
    /// </summary>
    /// <param name="input">存档参数，包含序列化后的完整存档数据字符串</param>
    /// <returns>保存结果 SaveGameOutput（含存档版本号、保存时间）</returns>
    [HttpPost("save")]
    public async Task<IActionResult> SaveGameAsync([FromBody] SaveGameInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SaveGameOutput>();
        }

        if (string.IsNullOrEmpty(input.SaveData))
        {
            return InvalidParamFail<SaveGameOutput>("存档数据不能为空");
        }

        var result = await _saveDataService.SaveGameAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<SaveGameOutput>("玩家不存在");
        }

        return Success(result, "保存成功");
    }

    /// <summary>
    /// 从云端读取玩家最新的存档数据供客户端加载
    /// </summary>
    /// <returns>存档数据 LoadGameOutput（含序列化存档字符串、版本号）</returns>
    [HttpGet("load")]
    public async Task<IActionResult> LoadGameAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<LoadGameOutput>();
        }

        var result = await _saveDataService.LoadGameAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<LoadGameOutput>("玩家不存在");
        }

        return Success(result, "读取成功");
    }

    /// <summary>
    /// 获取服务端解析后的完整结构化存档（各系统业务数据）
    /// </summary>
    /// <returns>完整结构化存档 FullSaveDataOutput（含玩家、背包、装备、技能等全部数据）</returns>
    [HttpGet("full")]
    public async Task<IActionResult> GetFullSaveDataAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<FullSaveDataOutput>();
        }

        var result = await _saveDataService.GetFullSaveDataAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<FullSaveDataOutput>("玩家不存在或无存档");
        }

        return Success(result, "获取成功");
    }

    /// <summary>
    /// 重置玩家全部存档数据（危险操作，会清除所有进度）
    /// </summary>
    /// <returns>重置结果 ResetSaveOutput（含清除状态）</returns>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetSaveAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<ResetSaveOutput>();
        }

        _logger.LogWarning("【危险操作】玩家 {PlayerId} 请求重置存档，TraceId: {TraceId}", playerId, HttpContext.TraceIdentifier);

        var result = await _saveDataService.ResetSaveAsync(playerId);
        if (result == null)
        {
            _logger.LogError("【危险操作失败】玩家 {PlayerId} 重置存档失败，TraceId: {TraceId}", playerId, HttpContext.TraceIdentifier);
            return NotFoundFail<ResetSaveOutput>("玩家不存在");
        }

        _logger.LogInformation("【危险操作完成】玩家 {PlayerId} 已成功重置存档，TraceId: {TraceId}", playerId, HttpContext.TraceIdentifier);
        return Success(result, "重置成功");
    }
}
