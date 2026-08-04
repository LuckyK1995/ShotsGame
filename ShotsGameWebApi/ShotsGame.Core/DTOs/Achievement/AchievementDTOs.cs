using ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Achievement;

/// <summary>
/// 成就出参
/// </summary>
public class AchievementOutput
{
    /// <summary>
    /// 成就ID
    /// </summary>
    public string AchievementId { get; set; } = string.Empty;

    /// <summary>
    /// 成就名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 成就描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 成就图标
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 成就分类（系统/等级等）
    /// </summary>
    public AchievementCategory Category { get; set; }

    /// <summary>
    /// 是否已解锁该成就
    /// </summary>
    public bool Unlocked { get; set; }

    /// <summary>
    /// 成就奖励是否已领取
    /// </summary>
    public bool Claimed { get; set; }

    /// <summary>
    /// 当前进度值
    /// </summary>
    public int Progress { get; set; }

    /// <summary>
    /// 目标进度值
    /// </summary>
    public int Target { get; set; }

    /// <summary>
    /// 奖励类型（金币/技能点等）
    /// </summary>
    public string RewardType { get; set; } = string.Empty;

    /// <summary>
    /// 奖励数值
    /// </summary>
    public long RewardValue { get; set; }

    /// <summary>
    /// 解锁时间（未解锁则为空）
    /// </summary>
    public DateTimeOffset? UnlockedAt { get; set; }
}

/// <summary>
/// 成就列表出参
/// </summary>
public class AchievementListOutput
{
    /// <summary>
    /// 系统成就列表
    /// </summary>
    public List<AchievementOutput> SystemAchievements { get; set; } = new();

    /// <summary>
    /// 等级成就列表
    /// </summary>
    public List<AchievementOutput> LevelAchievements { get; set; } = new();

    /// <summary>
    /// 已解锁成就总数
    /// </summary>
    public int TotalUnlocked { get; set; }

    /// <summary>
    /// 成就总数量
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 累计领取的奖励金币总数
    /// </summary>
    public long TotalClaimedRewardGold { get; set; }

    /// <summary>
    /// 累计领取的奖励技能点总数
    /// </summary>
    public int TotalClaimedRewardPoints { get; set; }
}

/// <summary>
/// 领取成就入参
/// </summary>
public class ClaimAchievementInput
{
    /// <summary>
    /// 要领取奖励的成就ID
    /// </summary>
    public string AchievementId { get; set; } = string.Empty;
}

/// <summary>
/// 领取成就出参
/// </summary>
public class ClaimAchievementOutput
{
    /// <summary>
    /// 领取是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 获得金币数量
    /// </summary>
    public long Gold { get; set; }

    /// <summary>
    /// 获得技能点数量
    /// </summary>
    public int SkillPoints { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}
