using ShotsGame.Core.DTOs.Inventory;

namespace ShotsGame.Core.DTOs.CheckIn;

/// <summary>
/// 签到出参
/// </summary>
public class CheckInOutput
{
    /// <summary>
    /// 周标识键（格式如 2024-W01）
    /// </summary>
    public string WeekKey { get; set; } = string.Empty;

    /// <summary>
    /// 本周已签到的日期索引列表
    /// </summary>
    public List<int> CheckedDays { get; set; } = new();

    /// <summary>
    /// 今天是星期几（0~6，对应周一到周日）
    /// </summary>
    public int TodayDayOfWeek { get; set; }

    /// <summary>
    /// 今日是否可以签到
    /// </summary>
    public bool CanCheckIn { get; set; }

    /// <summary>
    /// 连续签到天数
    /// </summary>
    public int ConsecutiveDays { get; set; }

    /// <summary>
    /// 今日签到奖励详情
    /// </summary>
    public CheckInRewardOutput TodayReward { get; set; } = new();
}

/// <summary>
/// 签到奖励出参
/// </summary>
public class CheckInRewardOutput
{
    /// <summary>
    /// 奖励对应的天数索引（0~6）
    /// </summary>
    public int DayIndex { get; set; }

    /// <summary>
    /// 奖励道具ID（无道具奖励则为空）
    /// </summary>
    public string? ItemId { get; set; }

    /// <summary>
    /// 奖励道具数量
    /// </summary>
    public int ItemCount { get; set; }

    /// <summary>
    /// 奖励金币数
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
}

/// <summary>
/// 本周奖励出参
/// </summary>
public class WeekRewardsOutput
{
    /// <summary>
    /// 周标识键
    /// </summary>
    public string WeekKey { get; set; } = string.Empty;

    /// <summary>
    /// 本周全部奖励列表
    /// </summary>
    public List<CheckInRewardOutput> Rewards { get; set; } = new();

    /// <summary>
    /// 本周已签到日期索引列表
    /// </summary>
    public List<int> CheckedDays { get; set; } = new();
}

/// <summary>
/// 执行签到出参
/// </summary>
public class DoCheckInOutput
{
    /// <summary>
    /// 签到是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 签到的天数索引
    /// </summary>
    public int DayIndex { get; set; }

    /// <summary>
    /// 获得金币数
    /// </summary>
    public long Gold { get; set; }

    /// <summary>
    /// 获得道具列表
    /// </summary>
    public List<ItemStackOutput> Items { get; set; } = new();

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}
