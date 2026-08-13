using System.Collections.Concurrent;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 在线状态服务实现：基于内存 ConcurrentDictionary 记录玩家最后心跳时间，超过5分钟未心跳视为离线
/// </summary>
public class OnlinePresenceService : IOnlinePresenceService
{
    /// <summary>在线心跳超时时间（5分钟）</summary>
    private static readonly TimeSpan OfflineTimeout = TimeSpan.FromMinutes(5);

    /// <summary>玩家最后活跃时间表（玩家ID -> 最后心跳时间）</summary>
    private readonly ConcurrentDictionary<string, DateTimeOffset> _lastActive = new();

    /// <summary>
    /// 标记玩家在线：更新心跳时间，并顺手清理已超时的离线玩家
    /// </summary>
    /// <param name="playerId">玩家ID</param>
    public void MarkOnline(string playerId)
    {
        if (string.IsNullOrEmpty(playerId))
        {
            return;
        }

        _lastActive[playerId] = DateTimeOffset.UtcNow;
        CleanupStale();
    }

    /// <summary>
    /// 标记玩家离线：从心跳表中移除
    /// </summary>
    /// <param name="playerId">玩家ID</param>
    public void MarkOffline(string playerId)
    {
        if (string.IsNullOrEmpty(playerId))
        {
            return;
        }

        _lastActive.TryRemove(playerId, out _);
    }

    /// <summary>
    /// 判断玩家是否在线：存在心跳且未超时
    /// </summary>
    /// <param name="playerId">玩家ID</param>
    /// <returns>在线返回 true，否则 false</returns>
    public bool IsOnline(string playerId)
    {
        if (string.IsNullOrEmpty(playerId))
        {
            return false;
        }

        if (_lastActive.TryGetValue(playerId, out var lastActive))
        {
            if (DateTimeOffset.UtcNow - lastActive <= OfflineTimeout)
            {
                return true;
            }

            // 已超时，主动清理
            _lastActive.TryRemove(playerId, out _);
        }

        return false;
    }

    /// <summary>
    /// 获取所有在线玩家ID（过滤掉超时的）
    /// </summary>
    /// <returns>在线玩家ID集合</returns>
    public IReadOnlyCollection<string> GetOnlinePlayerIds()
    {
        CleanupStale();
        return _lastActive.Keys.ToArray();
    }

    /// <summary>
    /// 清理已超时的玩家心跳记录
    /// </summary>
    private void CleanupStale()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var kv in _lastActive)
        {
            if (now - kv.Value > OfflineTimeout)
            {
                _lastActive.TryRemove(kv.Key, out _);
            }
        }
    }
}
