using ShotsGame.Core.DTOs.Inventory;

namespace ShotsGame.Core.DTOs.LotteryPot;

/// <summary>
/// 抽奖罐状态出参
/// </summary>
public class LotteryPotOutput
{
    /// <summary>
    /// 累计已使用抽奖罐总数量
    /// </summary>
    public int TotalUsed { get; set; }

    /// <summary>
    /// 上次使用时间（为空表示从未使用）
    /// </summary>
    public DateTimeOffset? LastUsedAt { get; set; }

    /// <summary>
    /// 当前可用抽奖罐数量
    /// </summary>
    public int AvailablePotCount { get; set; }
}

/// <summary>
/// 使用抽奖罐入参
/// </summary>
public class UseLotteryPotInput
{
    /// <summary>
    /// 使用抽奖罐的数量（默认1个）
    /// </summary>
    public int Count { get; set; } = 1;
}

/// <summary>
/// 奖励项
/// </summary>
public class LotteryPotReward
{
    /// <summary>
    /// 奖励类型（金币/经验/道具等）
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 奖励金币数（类型为金币时有值）
    /// </summary>
    public long? Gold { get; set; }

    /// <summary>
    /// 奖励经验值（类型为经验时有值）
    /// </summary>
    public long? Exp { get; set; }

    /// <summary>
    /// 奖励道具ID（类型为道具时有值）
    /// </summary>
    public string? ItemId { get; set; }

    /// <summary>
    /// 奖励道具数量（类型为道具时有值）
    /// </summary>
    public int? ItemCount { get; set; }

    /// <summary>
    /// 奖励名称
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 奖励图标
    /// </summary>
    public string? Icon { get; set; }
}

/// <summary>
/// 使用结果出参
/// </summary>
public class UseLotteryPotOutput
{
    /// <summary>
    /// 获得的奖励列表
    /// </summary>
    public List<LotteryPotReward> Rewards { get; set; } = new();

    /// <summary>
    /// 累计获得金币总数
    /// </summary>
    public long TotalGold { get; set; }

    /// <summary>
    /// 累计获得经验总数
    /// </summary>
    public long TotalExp { get; set; }

    /// <summary>
    /// 获得的道具列表
    /// </summary>
    public List<ItemStackOutput> ItemsAwarded { get; set; } = new();

    /// <summary>
    /// 本次使用的抽奖罐数量
    /// </summary>
    public int UseCount { get; set; }

    /// <summary>
    /// 使用后剩余抽奖罐数量
    /// </summary>
    public int RemainingPots { get; set; }
}
