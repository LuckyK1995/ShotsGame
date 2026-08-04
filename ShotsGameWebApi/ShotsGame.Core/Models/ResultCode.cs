namespace ShotsGame.Core.Models;

/// <summary>业务状态码枚举</summary>
public enum ResultCode
{
    /// <summary>成功</summary>
    Success = 0,

    /// <summary>失败（通用）</summary>
    Fail = 1,

    /// <summary>参数错误</summary>
    InvalidParam = 400,

    /// <summary>未登录/未授权</summary>
    Unauthorized = 401,

    /// <summary>无权限</summary>
    Forbidden = 403,

    /// <summary>资源不存在</summary>
    NotFound = 404,

    /// <summary>服务器内部错误</summary>
    ServerError = 500
}
