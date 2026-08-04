using System.Text.Json.Serialization;
using Enums = ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Battle;

/// <summary>
/// 提交战斗结算入参
/// </summary>
public class SubmitBattleInput
{
    /// <summary>
    /// 游戏模式
    /// </summary>
    public Enums.GameMode Mode { get; set; }

    /// <summary>
    /// 战斗结果（胜利/失败/平局等）
    /// </summary>
    public Enums.BattleResult Result { get; set; }

    /// <summary>
    /// 到达波次
    /// </summary>
    public int Wave { get; set; }

    /// <summary>
    /// 本次战斗获得分数
    /// </summary>
    public long Score { get; set; }

    /// <summary>
    /// 击杀敌人数量
    /// </summary>
    public int Kills { get; set; }

    /// <summary>
    /// 战斗持续时长（秒）
    /// </summary>
    public int DurationSeconds { get; set; }
}

/// <summary>
/// 战斗结算出参
/// </summary>
public class BattleResultOutput
{
    /// <summary>
    /// 战斗记录唯一标识
    /// </summary>
    public string RecordId { get; set; } = string.Empty;

    /// <summary>
    /// 获得金币数量
    /// </summary>
    public long GoldEarned { get; set; }

    /// <summary>
    /// 获得经验值
    /// </summary>
    public long ExpEarned { get; set; }

    /// <summary>
    /// 升级后的新等级
    /// </summary>
    public int NewLevel { get; set; }

    /// <summary>
    /// 升级后的当前经验值
    /// </summary>
    public long NewExp { get; set; }

    /// <summary>
    /// 距离下一级所需经验值
    /// </summary>
    public long NewExpToNextLevel { get; set; }

    /// <summary>
    /// 是否发生升级
    /// </summary>
    public bool LevelUp { get; set; }

    /// <summary>
    /// 更新后的最高波次记录
    /// </summary>
    public int NewMaxWave { get; set; }

    /// <summary>
    /// 更新后的历史最高分数
    /// </summary>
    public long NewScore { get; set; }

    /// <summary>
    /// 更新后的当前金币余额
    /// </summary>
    public long NewGold { get; set; }
}

/// <summary>
/// 战斗记录出参
/// </summary>
public class BattleRecordOutput
{
    /// <summary>
    /// 战斗记录唯一标识
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 游戏模式
    /// </summary>
    public Enums.GameMode Mode { get; set; }

    /// <summary>
    /// 战斗结果（胜利/失败/平局等）
    /// </summary>
    public Enums.BattleResult Result { get; set; }

    /// <summary>
    /// 到达波次
    /// </summary>
    public int Wave { get; set; }

    /// <summary>
    /// 获得分数
    /// </summary>
    public long Score { get; set; }

    /// <summary>
    /// 击杀敌人数量
    /// </summary>
    public int Kills { get; set; }

    /// <summary>
    /// 战斗持续时长（秒）
    /// </summary>
    public int DurationSeconds { get; set; }

    /// <summary>
    /// 获得金币数量
    /// </summary>
    public long GoldEarned { get; set; }

    /// <summary>
    /// 获得经验值
    /// </summary>
    public long ExpEarned { get; set; }

    /// <summary>
    /// 战斗发生时间
    /// </summary>
    public DateTimeOffset PlayedAt { get; set; }
}
