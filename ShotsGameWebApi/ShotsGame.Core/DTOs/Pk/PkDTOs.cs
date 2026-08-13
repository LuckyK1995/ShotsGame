namespace ShotsGame.Core.DTOs.Pk;

/// <summary>在线玩家出参（用于PK选择列表）</summary>
public class OnlinePlayerOutput
{
    /// <summary>玩家ID</summary>
    public string PlayerId { get; set; } = string.Empty;
    /// <summary>玩家昵称</summary>
    public string DisplayName { get; set; } = string.Empty;
    /// <summary>玩家等级</summary>
    public int Level { get; set; }
    /// <summary>战斗力</summary>
    public long Power { get; set; }
    /// <summary>PK胜场</summary>
    public int PkWins { get; set; }
    /// <summary>PK负场</summary>
    public int PkLosses { get; set; }
    /// <summary>PK总场次</summary>
    public int PkTotal { get; set; }
    /// <summary>胜率（0-100）</summary>
    public double PkWinRate { get; set; }
    /// <summary>是否在线</summary>
    public bool IsOnline { get; set; }
    /// <summary>最后活跃时间</summary>
    public DateTimeOffset LastActiveAt { get; set; }
}

/// <summary>上报PK结果入参</summary>
public class ReportPkResultInput
{
    /// <summary>应战方玩家ID</summary>
    public string DefenderId { get; set; } = string.Empty;
    /// <summary>是否胜利</summary>
    public bool IsWin { get; set; }
    /// <summary>对战时长（秒）</summary>
    public int DurationSeconds { get; set; }
}

/// <summary>PK记录出参</summary>
public class PkRecordOutput
{
    /// <summary>对战记录ID</summary>
    public string Id { get; set; } = string.Empty;
    /// <summary>挑战方玩家ID</summary>
    public string ChallengerId { get; set; } = string.Empty;
    /// <summary>挑战方昵称</summary>
    public string ChallengerName { get; set; } = string.Empty;
    /// <summary>应战方玩家ID</summary>
    public string DefenderId { get; set; } = string.Empty;
    /// <summary>应战方昵称</summary>
    public string DefenderName { get; set; } = string.Empty;
    /// <summary>胜方玩家ID（平局为null）</summary>
    public string? WinnerId { get; set; }
    /// <summary>对战时间</summary>
    public DateTimeOffset PlayedAt { get; set; }
    /// <summary>对战时长（秒）</summary>
    public int DurationSeconds { get; set; }
}

/// <summary>玩家真实战斗属性出参（用于PK对战时取对手属性）</summary>
public class PlayerBattleStatsOutput
{
    /// <summary>玩家ID</summary>
    public string PlayerId { get; set; } = string.Empty;

    // —— 基础战斗属性 ——
    /// <summary>攻击力</summary>
    public int Attack { get; set; }
    /// <summary>每秒攻击次数（PK BattleScene 口径：次/秒）</summary>
    public double AttackSpeed { get; set; }
    /// <summary>最大生命值</summary>
    public int MaxHealth { get; set; }
    /// <summary>暴击率（0~1 小数，如 0.15 = 15%）</summary>
    public double CritRate { get; set; }
    /// <summary>暴击伤害倍率（如 1.5 = 150% 伤害）</summary>
    public double CritDamage { get; set; }
    /// <summary>物理防御</summary>
    public int Defense { get; set; }
    /// <summary>射程</summary>
    public int Range { get; set; }
    /// <summary>物理穿透</summary>
    public int PhysicalPenetration { get; set; }
    /// <summary>通用抗性（百分数，0~N；减伤公式 1 / (1 + resistance/100)）</summary>
    public int Resistance { get; set; }

    // —— 4 种属性伤害加成（数值，例如 20 表示额外附加 20 点火伤）——
    /// <summary>火属性伤害加成</summary>
    public int FireDamageBonus { get; set; }
    /// <summary>冰属性伤害加成</summary>
    public int IceDamageBonus { get; set; }
    /// <summary>雷属性伤害加成</summary>
    public int LightningDamageBonus { get; set; }
    /// <summary>毒属性伤害加成</summary>
    public int PoisonDamageBonus { get; set; }

    // —— 4 种元素抗性（百分数，0~100，对应伤害减免）——
    /// <summary>火抗（%）</summary>
    public int FireResistance { get; set; }
    /// <summary>冰抗（%）</summary>
    public int IceResistance { get; set; }
    /// <summary>雷抗（%）</summary>
    public int LightningResistance { get; set; }
    /// <summary>毒抗（%）</summary>
    public int PoisonResistance { get; set; }

    /// <summary>属性来源：real(玩家快照真实属性) 或 fallback(估算公式兜底)</summary>
    public string Source { get; set; } = "fallback";
}
