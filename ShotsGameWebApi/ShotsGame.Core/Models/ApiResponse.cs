using System.Text.Json.Serialization;

namespace ShotsGame.Core.Models;

/// <summary>统一 API 响应模型</summary>
public class ApiResponse<T>
{
    /// <summary>状态码</summary>
    [JsonPropertyName("code")]
    public ResultCode Code { get; set; }

    /// <summary>响应数据</summary>
    [JsonPropertyName("data")]
    public T? Data { get; set; }

    /// <summary>提示消息</summary>
    [JsonPropertyName("message")]
    public string? Message { get; set; }

    /// <summary>追踪 ID</summary>
    [JsonPropertyName("traceId")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? TraceId { get; set; }

    /// <summary>构造成功响应</summary>
    public static ApiResponse<T> Ok(T? data, string? message = null, string? traceId = null)
        => new() { Code = ResultCode.Success, Data = data, Message = message, TraceId = traceId };

    /// <summary>构造失败响应</summary>
    public static ApiResponse<T> Fail(string message, ResultCode code = ResultCode.Fail, string? traceId = null)
        => new() { Code = code, Data = default, Message = message, TraceId = traceId };
}

/// <summary>无数据的 API 响应</summary>
public class ApiResponse : ApiResponse<object?>
{
    /// <summary>构造成功响应（无数据）</summary>
    public static ApiResponse Ok(string? message = null, string? traceId = null)
        => new() { Code = ResultCode.Success, Data = null, Message = message, TraceId = traceId };

    /// <summary>构造失败响应（无数据）</summary>
    public static new ApiResponse Fail(string message, ResultCode code = ResultCode.Fail, string? traceId = null)
        => new() { Code = code, Data = null, Message = message, TraceId = traceId };
}
