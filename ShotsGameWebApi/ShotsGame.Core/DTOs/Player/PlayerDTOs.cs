using System.Text.Json.Serialization;

namespace ShotsGame.Core.DTOs.Player;

/// <summary>
/// 玩家档案出参
/// </summary>
public class PlayerProfileOutput
{
    /// <summary>
    /// 玩家唯一ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 登录用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 玩家显示昵称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 头像URL
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// 绑定邮箱
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 玩家等级
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// 当前经验值
    /// </summary>
    public long Exp { get; set; }

    /// <summary>
    /// 升级到下一级所需经验值
    /// </summary>
    public long ExpToNextLevel { get; set; }

    /// <summary>
    /// 当前金币余额
    /// </summary>
    public long Gold { get; set; }

    /// <summary>
    /// 历史最高分数
    /// </summary>
    public long Score { get; set; }

    /// <summary>
    /// 可用技能点数
    /// </summary>
    public int SkillPoints { get; set; }

    /// <summary>
    /// 历史最高波次
    /// </summary>
    public int MaxWave { get; set; }

    /// <summary>
    /// 累计击杀敌人总数
    /// </summary>
    public int TotalKills { get; set; }

    /// <summary>
    /// 累计参加战斗总数
    /// </summary>
    public int TotalBattles { get; set; }

    /// <summary>
    /// 累计胜利战斗数
    /// </summary>
    public int TotalVictories { get; set; }

    /// <summary>
    /// 上次活跃时间
    /// </summary>
    public DateTimeOffset LastActiveAt { get; set; }
}

/// <summary>
/// 更新玩家档案入参
/// </summary>
public class UpdatePlayerInput
{
    /// <summary>
    /// 新的显示昵称（不修改则为空）
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 新的头像URL（不修改则为空）
    /// </summary>
    public string? AvatarUrl { get; set; }
}

/// <summary>
/// 排行榜条目
/// </summary>
public class LeaderboardEntryOutput
{
    /// <summary>
    /// 排名名次（从1开始）
    /// </summary>
    public int Rank { get; set; }

    /// <summary>
    /// 玩家ID
    /// </summary>
    public string PlayerId { get; set; } = string.Empty;

    /// <summary>
    /// 玩家显示昵称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 玩家头像URL
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// 玩家等级
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// 玩家分数（用于排名依据）
    /// </summary>
    public long Score { get; set; }

    /// <summary>
    /// 玩家最高波次记录
    /// </summary>
    public int MaxWave { get; set; }
}
