using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.Models;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 应用控制器基类：封装当前玩家身份获取、统一成功/失败响应等公共基础逻辑
/// </summary>
[ApiController]
public abstract class AppControllerBase : ControllerBase
{
    /// <summary>当前登录玩家ID</summary>
    protected string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    /// <summary>获取当前玩家ID，未登录返回null</summary>
    protected string? GetCurrentUserId() => CurrentUserId;

    /// <summary>检查玩家是否已登录</summary>
    protected bool IsUserLoggedIn() => !string.IsNullOrEmpty(CurrentUserId);

    // ─── 成功响应 ───

    /// <summary>返回成功响应（带数据）</summary>
    protected IActionResult Success<T>(T? data, string? message = null)
        => Ok(ApiResponse<T>.Ok(data, message, HttpContext.TraceIdentifier));

    /// <summary>返回成功响应（无数据）</summary>
    protected IActionResult Success(string? message = null)
        => Ok(ApiResponse.Ok(message, HttpContext.TraceIdentifier));

    // ─── 失败响应 ───

    /// <summary>返回失败响应</summary>
    protected IActionResult Fail(string message, ResultCode code = ResultCode.Fail)
        => Ok(ApiResponse.Fail(message, code, HttpContext.TraceIdentifier));

    /// <summary>返回失败响应（带泛型）</summary>
    protected IActionResult Fail<T>(string message, ResultCode code = ResultCode.Fail)
        => Ok(ApiResponse<T>.Fail(message, code, HttpContext.TraceIdentifier));

    /// <summary>返回未登录失败响应</summary>
    protected IActionResult UnauthorizedFail(string message = "玩家未登录")
        => Ok(ApiResponse.Fail(message, ResultCode.Unauthorized, HttpContext.TraceIdentifier));

    /// <summary>返回未登录失败响应（带泛型）</summary>
    protected IActionResult UnauthorizedFail<T>(string message = "玩家未登录")
        => Ok(ApiResponse<T>.Fail(message, ResultCode.Unauthorized, HttpContext.TraceIdentifier));

    /// <summary>返回资源不存在失败响应</summary>
    protected IActionResult NotFoundFail(string message = "资源不存在")
        => Ok(ApiResponse.Fail(message, ResultCode.NotFound, HttpContext.TraceIdentifier));

    /// <summary>返回资源不存在失败响应（带泛型）</summary>
    protected IActionResult NotFoundFail<T>(string message = "资源不存在")
        => Ok(ApiResponse<T>.Fail(message, ResultCode.NotFound, HttpContext.TraceIdentifier));

    /// <summary>返回参数错误失败响应</summary>
    protected IActionResult InvalidParamFail(string message = "参数错误")
        => Ok(ApiResponse.Fail(message, ResultCode.InvalidParam, HttpContext.TraceIdentifier));

    /// <summary>返回参数错误失败响应（带泛型）</summary>
    protected IActionResult InvalidParamFail<T>(string message = "参数错误")
        => Ok(ApiResponse<T>.Fail(message, ResultCode.InvalidParam, HttpContext.TraceIdentifier));
}
