using System.Net;
using System.Text.Json;
using ShotsGame.Core.Models;

namespace ShotsGame.WebApi.Middlewares;

/// <summary>全局异常处理中间件</summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "全局异常：{Message}", ex.Message);
            await WriteExceptionAsync(context, ex);
        }
    }

    private async Task WriteExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.StatusCode = ex switch
        {
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var message = _env.IsDevelopment() ? ex.Message : ex switch
        {
            UnauthorizedAccessException => "未授权",
            ArgumentException => "请求参数无效",
            KeyNotFoundException => "资源不存在",
            InvalidOperationException => "操作无效",
            _ => "服务器内部错误"
        };

        var traceId = context.TraceIdentifier;
        var payload = ApiResponse<object?>.Fail(message, ResultCode.ServerError, traceId);
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        await context.Response.WriteAsync(json);
    }
}
