using ShotsGame.Core.DTOs.Inventory;

namespace ShotsGame.Core.DTOs.OnlineReward;

/// <summary>
/// 在线奖励出参
/// </summary>
public class OnlineRewardOutput
{
    /// <summary>
    /// 当日累计在线时长（分钟）
    /// </summary>
    public int OnlineMinutes { get; set; }

    /// <summary>
    /// 已领取的最高档位等级
    /// </summary>
    public int ClaimedLevel { get; set; }

    /// <summary>
    /// 距离下一奖励所需的在线分钟数
    /// </summary>
    public int NextRewardMinutes { get; set; }

    /// <summary>
    /// 当前可领取档位的奖励信息（若无则为空）
    /// </summary>
    public RewardTierOutput? CurrentTierReward { get; set; }

    /// <summary>
    /// 全部奖励档位列表
    /// </summary>
    public List<RewardTierOutput> Tiers { get; set; } = new();
}

/// <summary>
/// 档位出参
/// </summary>
public class RewardTierOutput
{
    /// <summary>
    /// 档位等级（从1开始）
    /// </summary>
    public int Tier { get; set; }

    /// <summary>
    /// 达到该档位所需的累计在线分钟数
    /// </summary>
    public int RequiredMinutes { get; set; }

    /// <summary>
    /// 奖励道具ID（若无道具奖励则为空）
    /// </summary>
    public string? ItemId { get; set; }

    /// <summary>
    /// 奖励道具数量
    /// </summary>
    public int ItemCount { get; set; }

    /// <summary>
    /// 奖励金币数量
    /// </summary>
    public long Gold { get; set; }

    /// <summary>
    /// 奖励名称
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 奖励图标
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 是否已领取该档位奖励
    /// </summary>
    public bool Claimed { get; set; }

    /// <summary>
    /// 是否满足条件可以领取
    /// </summary>
    public bool CanClaim { get; set; }
}

/// <summary>
/// 领取出参
/// </summary>
public class ClaimOnlineRewardOutput
{
    /// <summary>
    /// 领取的档位等级
    /// </summary>
    public int Tier { get; set; }

    /// <summary>
    /// 获得金币数量
    /// </summary>
    public long Gold { get; set; }

    /// <summary>
    /// 获得道具列表
    /// </summary>
    public List<ItemStackOutput> Items { get; set; } = new();

    /// <summary>
    /// 更新后的已领取档位等级
    /// </summary>
    public int NewClaimedLevel { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}
