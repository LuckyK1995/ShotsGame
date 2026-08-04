using ShotsGame.Core.DTOs.Inventory;
using Enums = ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.GameMode;

/// <summary>
/// 游戏模式出参
/// </summary>
public class GameModeOutput
{
    /// <summary>
    /// 游戏模式枚举值
    /// </summary>
    public Enums.GameMode Mode { get; set; }

    /// <summary>
    /// 模式名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 模式详细描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 解锁该模式所需的玩家等级
    /// </summary>
    public int UnlockLevel { get; set; }

    /// <summary>
    /// 每日最大挑战次数（为空表示无限制）
    /// </summary>
    public int? MaxDailyAttempts { get; set; }

    /// <summary>
    /// 今日已挑战次数
    /// </summary>
    public int TodayAttempts { get; set; }

    /// <summary>
    /// 敌人属性倍率
    /// </summary>
    public double EnemyMultiplier { get; set; }

    /// <summary>
    /// 奖励倍率
    /// </summary>
    public double RewardMultiplier { get; set; }

    /// <summary>
    /// 难度等级
    /// </summary>
    public Enums.DifficultyLevel Difficulty { get; set; }

    /// <summary>
    /// 该模式的特性列表
    /// </summary>
    public List<string> Features { get; set; } = new();
}

/// <summary>
/// 模式列表出参
/// </summary>
public class GameModeListOutput
{
    /// <summary>
    /// 可用的游戏模式列表
    /// </summary>
    public List<GameModeOutput> Modes { get; set; } = new();

    /// <summary>
    /// 玩家当前等级
    /// </summary>
    public int PlayerLevel { get; set; }
}

/// <summary>
/// 开始游戏入参
/// </summary>
public class StartGameInput
{
    /// <summary>
    /// 要进入的游戏模式
    /// </summary>
    public Enums.GameMode Mode { get; set; }

    /// <summary>
    /// 选择的难度等级（默认为普通）
    /// </summary>
    public Enums.DifficultyLevel Difficulty { get; set; } = Enums.DifficultyLevel.Normal;

    /// <summary>
    /// 材料副本类型（仅材料副本模式需要传入）
    /// </summary>
    public Enums.MaterialDungeonType? MaterialType { get; set; }
}

/// <summary>
/// 开始游戏出参
/// </summary>
public class StartGameOutput
{
    /// <summary>
    /// 战斗会话唯一标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 当前游戏模式
    /// </summary>
    public Enums.GameMode Mode { get; set; }

    /// <summary>
    /// 选择的难度等级
    /// </summary>
    public Enums.DifficultyLevel Difficulty { get; set; }

    /// <summary>
    /// 当前波次（从1开始）
    /// </summary>
    public int Wave { get; set; } = 1;

    /// <summary>
    /// 时间限制（秒），为空表示无时间限制
    /// </summary>
    public int? TimeLimitSeconds { get; set; }

    /// <summary>
    /// 本场游戏生效的特性列表
    /// </summary>
    public List<string> Features { get; set; } = new();
}

/// <summary>
/// 材料副本信息
/// </summary>
public class MaterialDungeonInfo
{
    /// <summary>
    /// 材料副本类型
    /// </summary>
    public Enums.MaterialDungeonType Type { get; set; }

    /// <summary>
    /// 副本名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 副本详细描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 每日最大挑战次数
    /// </summary>
    public int MaxDailyAttempts { get; set; } = 5;

    /// <summary>
    /// 今日已挑战次数
    /// </summary>
    public int TodayAttempts { get; set; }

    /// <summary>
    /// 奖励预览列表
    /// </summary>
    public List<ItemStackOutput> RewardPreview { get; set; } = new();
}

/// <summary>
/// 材料副本列表出参
/// </summary>
public class MaterialDungeonListOutput
{
    /// <summary>
    /// 材料副本信息列表
    /// </summary>
    public List<MaterialDungeonInfo> Dungeons { get; set; } = new();

    /// <summary>
    /// 玩家当前等级
    /// </summary>
    public int PlayerLevel { get; set; }
}
