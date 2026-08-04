using ShotsGame.Core.Enums;

namespace ShotsGame.Core.DTOs.Calculate;

/// <summary>
/// 属性计算入参
/// </summary>
public class PlayerStatsInput
{
    /// <summary>
    /// 玩家ID
    /// </summary>
    public string PlayerId { get; set; } = string.Empty;
}

/// <summary>
/// 属性计算结果出参
/// </summary>
public class PlayerStatsOutput
{
    /// <summary>
    /// 攻击力
    /// </summary>
    public int Attack { get; set; }

    /// <summary>
    /// 自动攻击间隔（毫秒）
    /// </summary>
    public double AttackSpeedMs { get; set; }

    /// <summary>
    /// 手动攻击间隔（毫秒）
    /// </summary>
    public double ManualAttackSpeedMs { get; set; }

    /// <summary>
    /// 攻击射程
    /// </summary>
    public int Range { get; set; }

    /// <summary>
    /// 最大生命值
    /// </summary>
    public int MaxHealth { get; set; }

    /// <summary>
    /// 防御力
    /// </summary>
    public double Defense { get; set; }

    /// <summary>
    /// 暴击率（0~1）
    /// </summary>
    public double CritRate { get; set; }

    /// <summary>
    /// 暴击伤害倍率
    /// </summary>
    public double CritDamage { get; set; }

    /// <summary>
    /// 物理穿透值
    /// </summary>
    public int PhysicalPenetration { get; set; }

    /// <summary>
    /// 子弹穿透敌人数量
    /// </summary>
    public int BulletPierceCount { get; set; }

    /// <summary>
    /// 生命偷取百分比
    /// </summary>
    public double LifestealPercent { get; set; }

    /// <summary>
    /// 生命偷取固定值
    /// </summary>
    public int LifestealFlat { get; set; }

    /// <summary>
    /// 金币加成倍率
    /// </summary>
    public double GoldBonus { get; set; }

    /// <summary>
    /// 经验加成倍率
    /// </summary>
    public double ExpBonus { get; set; }

    /// <summary>
    /// 灼烧触发概率
    /// </summary>
    public double BurnChance { get; set; }

    /// <summary>
    /// 灼烧伤害值
    /// </summary>
    public int BurnDamage { get; set; }

    /// <summary>
    /// 灼烧持续时间（毫秒）
    /// </summary>
    public int BurnDurationMs { get; set; }

    /// <summary>
    /// 中毒触发概率
    /// </summary>
    public double PoisonChance { get; set; }

    /// <summary>
    /// 中毒伤害值
    /// </summary>
    public int PoisonDamage { get; set; }

    /// <summary>
    /// 中毒持续时间（毫秒）
    /// </summary>
    public int PoisonDurationMs { get; set; }

    /// <summary>
    /// 冰冻触发概率
    /// </summary>
    public double FreezeChance { get; set; }

    /// <summary>
    /// 冰冻减速幅度（0~1）
    /// </summary>
    public double FreezeSlowAmount { get; set; }

    /// <summary>
    /// 冰冻持续时间（毫秒）
    /// </summary>
    public int FreezeDurationMs { get; set; }

    /// <summary>
    /// 雷击触发概率
    /// </summary>
    public double LightningChance { get; set; }

    /// <summary>
    /// 雷击连锁次数
    /// </summary>
    public int LightningChain { get; set; }

    /// <summary>
    /// 雷击伤害值
    /// </summary>
    public int LightningDamage { get; set; }

    /// <summary>
    /// 元素抗性
    /// </summary>
    public double Resistance { get; set; }

    /// <summary>
    /// 元素伤害加成（JSON 字符串格式）
    /// </summary>
    public string ElementalDamageBonusJson { get; set; } = string.Empty;

    /// <summary>
    /// 每秒生命回复值
    /// </summary>
    public double RegenPerSec { get; set; }

    /// <summary>
    /// 总战斗力
    /// </summary>
    public long Power { get; set; }
}

/// <summary>
/// 战斗力计算入参
/// </summary>
public class PowerCalculationInput
{
    /// <summary>
    /// 攻击力
    /// </summary>
    public int Attack { get; set; }

    /// <summary>
    /// 自动攻击间隔（毫秒）
    /// </summary>
    public double AttackSpeedMs { get; set; }

    /// <summary>
    /// 手动攻击间隔（毫秒）
    /// </summary>
    public double ManualAttackSpeedMs { get; set; }

    /// <summary>
    /// 攻击射程
    /// </summary>
    public int Range { get; set; }

    /// <summary>
    /// 最大生命值
    /// </summary>
    public int MaxHealth { get; set; }

    /// <summary>
    /// 防御力
    /// </summary>
    public double Defense { get; set; }

    /// <summary>
    /// 暴击率（0~1）
    /// </summary>
    public double CritRate { get; set; }

    /// <summary>
    /// 暴击伤害倍率
    /// </summary>
    public double CritDamage { get; set; }

    /// <summary>
    /// 物理穿透值
    /// </summary>
    public int PhysicalPenetration { get; set; }

    /// <summary>
    /// 子弹穿透敌人数量
    /// </summary>
    public int BulletPierceCount { get; set; }

    /// <summary>
    /// 生命偷取百分比
    /// </summary>
    public double LifestealPercent { get; set; }

    /// <summary>
    /// 生命偷取固定值
    /// </summary>
    public int LifestealFlat { get; set; }

    /// <summary>
    /// 金币加成倍率
    /// </summary>
    public double GoldBonus { get; set; }

    /// <summary>
    /// 经验加成倍率
    /// </summary>
    public double ExpBonus { get; set; }

    /// <summary>
    /// 灼烧触发概率
    /// </summary>
    public double BurnChance { get; set; }

    /// <summary>
    /// 灼烧伤害值
    /// </summary>
    public int BurnDamage { get; set; }

    /// <summary>
    /// 灼烧持续时间（毫秒）
    /// </summary>
    public int BurnDurationMs { get; set; }

    /// <summary>
    /// 中毒触发概率
    /// </summary>
    public double PoisonChance { get; set; }

    /// <summary>
    /// 中毒伤害值
    /// </summary>
    public int PoisonDamage { get; set; }

    /// <summary>
    /// 中毒持续时间（毫秒）
    /// </summary>
    public int PoisonDurationMs { get; set; }

    /// <summary>
    /// 冰冻触发概率
    /// </summary>
    public double FreezeChance { get; set; }

    /// <summary>
    /// 冰冻减速幅度（0~1）
    /// </summary>
    public double FreezeSlowAmount { get; set; }

    /// <summary>
    /// 冰冻持续时间（毫秒）
    /// </summary>
    public int FreezeDurationMs { get; set; }

    /// <summary>
    /// 雷击触发概率
    /// </summary>
    public double LightningChance { get; set; }

    /// <summary>
    /// 雷击连锁次数
    /// </summary>
    public int LightningChain { get; set; }

    /// <summary>
    /// 雷击伤害值
    /// </summary>
    public int LightningDamage { get; set; }

    /// <summary>
    /// 元素抗性
    /// </summary>
    public double Resistance { get; set; }

    /// <summary>
    /// 元素伤害加成（JSON 字符串格式）
    /// </summary>
    public string ElementalDamageBonusJson { get; set; } = string.Empty;

    /// <summary>
    /// 每秒生命回复值
    /// </summary>
    public double RegenPerSec { get; set; }

    /// <summary>
    /// 总战斗力
    /// </summary>
    public long Power { get; set; }
}

/// <summary>
/// 经验计算出参
/// </summary>
public class ExpCalculationOutput
{
    /// <summary>
    /// 当前等级
    /// </summary>
    public int CurrentLevel { get; set; }

    /// <summary>
    /// 当前拥有的经验值
    /// </summary>
    public long CurrentExp { get; set; }

    /// <summary>
    /// 升级到下一级所需经验（从0开始）
    /// </summary>
    public long ExpToNextLevel { get; set; }

    /// <summary>
    /// 距离升级还需的经验值
    /// </summary>
    public long ExpRequired { get; set; }

    /// <summary>
    /// 当前等级经验进度百分比（0~100）
    /// </summary>
    public double LevelProgressPercent { get; set; }

    /// <summary>
    /// 升级奖励信息
    /// </summary>
    public NextLevelBonusOutput NextLevelBonus { get; set; } = new();
}

/// <summary>
/// 升级奖励出参
/// </summary>
public class NextLevelBonusOutput
{
    /// <summary>
    /// 升级获得的技能点
    /// </summary>
    public int SkillPoints { get; set; } = 1;

    /// <summary>
    /// 升级时是否回满生命
    /// </summary>
    public bool HealthRefreshed { get; set; } = true;

    /// <summary>
    /// 攻击力加成百分比
    /// </summary>
    public double AttackBonusPercent { get; set; } = 1.5;

    /// <summary>
    /// 最大生命值加成百分比
    /// </summary>
    public double MaxHealthBonusPercent { get; set; } = 1.8;
}

/// <summary>
/// 金币计算入参
/// </summary>
public class GoldCalculationInput
{
    /// <summary>
    /// 基础金币数量
    /// </summary>
    public long BaseGold { get; set; }

    /// <summary>
    /// 金币加成百分比（为空则使用玩家当前加成）
    /// </summary>
    public double? GoldBonusPercent { get; set; }

    /// <summary>
    /// 到达波次（用于波次奖励）
    /// </summary>
    public int? Wave { get; set; }

    /// <summary>
    /// 击杀数（用于击杀奖励）
    /// </summary>
    public int? KillCount { get; set; }

    /// <summary>
    /// 战斗结果（用于胜负奖励修正）
    /// </summary>
    public BattleResult? BattleResult { get; set; }
}

/// <summary>
/// 金币计算出参
/// </summary>
public class GoldCalculationOutput
{
    /// <summary>
    /// 基础金币数量
    /// </summary>
    public long BaseGold { get; set; }

    /// <summary>
    /// 额外加成金币数量
    /// </summary>
    public long BonusGold { get; set; }

    /// <summary>
    /// 最终获得的金币总数
    /// </summary>
    public long TotalGold { get; set; }

    /// <summary>
    /// 金币明细（键为来源名称，值为对应金币数）
    /// </summary>
    public Dictionary<string, long> Breakdown { get; set; } = new();
}
