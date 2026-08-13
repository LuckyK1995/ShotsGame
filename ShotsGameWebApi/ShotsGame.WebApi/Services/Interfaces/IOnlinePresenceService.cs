namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 在线状态服务：基于内存 ConcurrentDictionary 管理，LastActiveAt 超时5分钟视为离线
/// </summary>
public interface IOnlinePresenceService
{
    /// <summary>标记玩家在线（登录/请求时调用）</summary>
    void MarkOnline(string playerId);
    /// <summary>标记玩家离线（登出时调用）</summary>
    void MarkOffline(string playerId);
    /// <summary>判断玩家是否在线</summary>
    bool IsOnline(string playerId);
    /// <summary>获取所有在线玩家ID</summary>
    IReadOnlyCollection<string> GetOnlinePlayerIds();
}
