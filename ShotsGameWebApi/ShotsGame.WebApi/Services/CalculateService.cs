using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Calculate;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 数值计算服务：玩家属性计算、战力计算、经验进度计算、金币收益计算
/// </summary>
public class CalculateService : ICalculateService
{
    private const int BaseAttack = 8;
    private const double BaseAttackSpeedMs = 800;
    private const int BaseMaxHealth = 100;
    private const int BaseRange = 200;

    private readonly IPlayerRepository _playerRepository;
    private readonly GameDbContext _context;

    public CalculateService(
        IPlayerRepository playerRepository,
        GameDbContext context)
    {
        _playerRepository = playerRepository;
        _context = context;
    }

    /// <summary>
    /// 计算玩家完整战斗属性（含等级加成、装备主属性、强化加成、宝石镶嵌、词缀效果）并返回最终属性面板
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>玩家属性输出对象（攻击、攻速、生命、防御、暴击、元素效果、战力等），玩家不存在返回 null</returns>
    public async Task<PlayerStatsOutput?> CalculatePlayerStatsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var equippedItems = await _context.Equipments
            .Where(e => e.PlayerId == playerId && e.IsEquipped && !e.IsDeleted)
            .ToListAsync();

        var attack = BaseAttack;
        var attackSpeedMs = BaseAttackSpeedMs;
        var maxHealth = BaseMaxHealth;
        var range = BaseRange;
        var defense = 0.0;
        var critRate = 0.0;
        var critDamage = 1.5;
        var physicalPenetration = 0;
        var bulletPierceCount = 0;
        var lifestealPercent = 0.0;
        var lifestealFlat = 0;
        var goldBonus = 0.0;
        var expBonus = 0.0;
        var burnChance = 0.0;
        var burnDamage = 0;
        var burnDurationMs = 0;
        var poisonChance = 0.0;
        var poisonDamage = 0;
        var poisonDurationMs = 0;
        var freezeChance = 0.0;
        var freezeSlowAmount = 0.0;
        var freezeDurationMs = 0;
        var lightningChance = 0.0;
        var lightningChain = 0;
        var lightningDamage = 0;
        var resistance = 0.0;
        var regenPerSec = 0.0;
        var elementalBonuses = new Dictionary<string, double>();

        var levelBonusAttack = (player.Level - 1) * 2;
        var levelBonusHealth = (player.Level - 1) * 10;
        attack += levelBonusAttack;
        maxHealth += levelBonusHealth;

        foreach (var equip in equippedItems)
        {
            if (equip.Attack.HasValue)
            {
                attack += equip.Attack.Value;
            }
            if (equip.AttackSpeed.HasValue)
            {
                attackSpeedMs *= (1.0 - equip.AttackSpeed.Value / 100.0);
            }
            if (equip.Range.HasValue)
            {
                range += equip.Range.Value;
            }
            if (equip.Health.HasValue)
            {
                maxHealth += equip.Health.Value;
            }
            if (equip.Defense.HasValue)
            {
                defense += equip.Defense.Value;
            }
            if (equip.CritRate.HasValue)
            {
                critRate += equip.CritRate.Value;
            }
            if (equip.CritDamage.HasValue)
            {
                critDamage += equip.CritDamage.Value;
            }
            if (equip.Pierce.HasValue)
            {
                bulletPierceCount += equip.Pierce.Value;
            }

            if (equip.EnhanceLevel > 0)
            {
                var enhanceAttackBonus = equip.Attack.HasValue ? (int)Math.Floor(equip.Attack.Value * equip.EnhanceLevel * 0.1) : 0;
                var enhanceHealthBonus = equip.Health.HasValue ? (int)Math.Floor(equip.Health.Value * equip.EnhanceLevel * 0.1) : 0;
                attack += enhanceAttackBonus;
                maxHealth += enhanceHealthBonus;
            }

            if (!string.IsNullOrEmpty(equip.SocketedGemsJson))
            {
                var gems = ParseGemJson(equip.SocketedGemsJson);
                foreach (var gem in gems)
                {
                    switch (gem.Type)
                    {
                        case "attack":
                            attack += gem.Value;
                            break;
                        case "health":
                            maxHealth += gem.Value;
                            break;
                        case "defense":
                            defense += gem.Value;
                            break;
                        case "critrate":
                            critRate += gem.Value / 100.0;
                            break;
                        case "resistance":
                            resistance += gem.Value / 100.0;
                            break;
                    }
                }
            }

            if (!string.IsNullOrEmpty(equip.AffixesJson))
            {
                var affixes = ParseAffixJson(equip.AffixesJson);
                foreach (var affix in affixes)
                {
                    ApplyAffixBonus(affix, ref attack, ref attackSpeedMs, ref maxHealth, ref range,
                        ref defense, ref critRate, ref critDamage, ref physicalPenetration,
                        ref lifestealPercent, ref lifestealFlat, ref goldBonus, ref expBonus,
                        ref burnChance, ref burnDamage, ref burnDurationMs,
                        ref poisonChance, ref poisonDamage, ref poisonDurationMs,
                        ref freezeChance, ref freezeSlowAmount, ref freezeDurationMs,
                        ref lightningChance, ref lightningChain, ref lightningDamage,
                        ref resistance, ref regenPerSec, elementalBonuses);
                }
            }
        }

        var stats = new PlayerStatsOutput
        {
            Attack = Math.Max(1, attack),
            AttackSpeedMs = Math.Max(100, attackSpeedMs),
            ManualAttackSpeedMs = Math.Max(100, attackSpeedMs * 0.7),
            Range = Math.Max(50, range),
            MaxHealth = Math.Max(1, maxHealth),
            Defense = Math.Max(0, defense),
            CritRate = Math.Min(1.0, Math.Max(0, critRate)),
            CritDamage = Math.Max(1.0, critDamage),
            PhysicalPenetration = Math.Max(0, physicalPenetration),
            BulletPierceCount = Math.Max(0, bulletPierceCount),
            LifestealPercent = Math.Max(0, lifestealPercent),
            LifestealFlat = Math.Max(0, lifestealFlat),
            GoldBonus = Math.Max(0, goldBonus),
            ExpBonus = Math.Max(0, expBonus),
            BurnChance = Math.Min(1.0, Math.Max(0, burnChance)),
            BurnDamage = Math.Max(0, burnDamage),
            BurnDurationMs = Math.Max(0, burnDurationMs),
            PoisonChance = Math.Min(1.0, Math.Max(0, poisonChance)),
            PoisonDamage = Math.Max(0, poisonDamage),
            PoisonDurationMs = Math.Max(0, poisonDurationMs),
            FreezeChance = Math.Min(1.0, Math.Max(0, freezeChance)),
            FreezeSlowAmount = Math.Min(0.9, Math.Max(0, freezeSlowAmount)),
            FreezeDurationMs = Math.Max(0, freezeDurationMs),
            LightningChance = Math.Min(1.0, Math.Max(0, lightningChance)),
            LightningChain = Math.Max(0, lightningChain),
            LightningDamage = Math.Max(0, lightningDamage),
            Resistance = Math.Min(0.9, Math.Max(0, resistance)),
            ElementalDamageBonusJson = JsonSerializer.Serialize(elementalBonuses),
            RegenPerSec = Math.Max(0, regenPerSec),
            Power = 0
        };

        stats.Power = await CalculatePowerAsync(stats);
        return stats;
    }

    /// <summary>
    /// 根据玩家属性面板计算综合战斗力数值（攻击、攻速、生命、防御、暴击、元素效果等加权求和）
    /// </summary>
    /// <param name="stats">玩家属性面板</param>
    /// <returns>战斗力数值（长整型）</returns>
    public Task<long> CalculatePowerAsync(PlayerStatsOutput stats)
    {
        var attackScore = stats.Attack * 2.0;
        var attackSpeedScore = (1000.0 / Math.Max(100, stats.AttackSpeedMs)) * 50.0;
        var rangeScore = stats.Range * 0.1;
        var healthScore = stats.MaxHealth * 0.5;
        var defenseScore = stats.Defense * 1.5;
        var critRateScore = stats.CritRate * 200.0;
        var critDamageScore = (stats.CritDamage - 1.0) * 150.0;
        var pierceScore = stats.BulletPierceCount * 30.0;
        var lifestealScore = stats.LifestealPercent * 300.0 + stats.LifestealFlat * 0.5;
        var goldExpBonusScore = (stats.GoldBonus + stats.ExpBonus) * 2.0;
        var elementalScore = (stats.BurnChance * 100.0 + stats.PoisonChance * 100.0 +
                             stats.FreezeChance * 150.0 + stats.LightningChance * 120.0) * 2.0;
        var resistanceScore = stats.Resistance * 200.0;
        var regenScore = stats.RegenPerSec * 10.0;

        var total = attackScore + attackSpeedScore + rangeScore + healthScore + defenseScore +
                    critRateScore + critDamageScore + pierceScore + lifestealScore +
                    goldExpBonusScore + elementalScore + resistanceScore + regenScore;

        return Task.FromResult((long)Math.Floor(total));
    }

    /// <summary>
    /// 计算玩家经验升级进度（当前等级、当前经验、升级所需经验、升级奖励预览）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>经验进度输出对象，玩家不存在返回 null</returns>
    public async Task<ExpCalculationOutput?> CalculateExpAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var expToNext = CalculateExpToNextLevel(player.Level);
        var expRequired = expToNext - player.Exp;
        var progressPercent = expToNext > 0 ? (double)player.Exp / expToNext * 100.0 : 0;

        return new ExpCalculationOutput
        {
            CurrentLevel = player.Level,
            CurrentExp = player.Exp,
            ExpToNextLevel = expToNext,
            ExpRequired = Math.Max(0, expRequired),
            LevelProgressPercent = Math.Min(100.0, Math.Max(0, progressPercent)),
            NextLevelBonus = new NextLevelBonusOutput
            {
                SkillPoints = 1,
                HealthRefreshed = true,
                AttackBonusPercent = 1.5,
                MaxHealthBonusPercent = 1.8
            }
        };
    }

    /// <summary>
    /// 计算金币收益（按基础金币、加成比例、波次、击杀数、胜负结果分阶段计算并返回明细）
    /// </summary>
    /// <param name="input">金币计算参数（基础金币、加成比例、波次、击杀数、战斗结果）</param>
    /// <returns>金币计算输出（基础、加成、总额、分项明细），基础金币为负返回 null</returns>
    public Task<GoldCalculationOutput?> CalculateGoldAsync(GoldCalculationInput input)
    {
        if (input.BaseGold < 0)
        {
            return Task.FromResult<GoldCalculationOutput?>(null);
        }

        var breakdown = new Dictionary<string, long>();
        long total = 0;

        var baseGold = input.BaseGold;
        breakdown["基础金币"] = baseGold;
        total += baseGold;

        var bonusPercent = input.GoldBonusPercent ?? 0;
        if (bonusPercent > 0)
        {
            var bonusGold = (long)Math.Floor(baseGold * bonusPercent / 100.0);
            breakdown[$"加成({bonusPercent}%)"] = bonusGold;
            total += bonusGold;
        }

        var wave = input.Wave ?? 0;
        if (wave > 0)
        {
            var waveGold = wave * 10;
            breakdown[$"波次奖励(x{wave})"] = waveGold;
            total += waveGold;
        }

        var killCount = input.KillCount ?? 0;
        if (killCount > 0)
        {
            var killGold = killCount * 5;
            breakdown[$"击杀奖励(x{killCount})"] = killGold;
            total += killGold;
        }

        var isVictory = input.BattleResult == BattleResult.Victory;
        if (isVictory)
        {
            var victoryBonus = total;
            breakdown["胜利翻倍"] = victoryBonus;
            total *= 2;
        }

        var bonusGoldTotal = total - baseGold;

        return Task.FromResult<GoldCalculationOutput?>(new GoldCalculationOutput
        {
            BaseGold = baseGold,
            BonusGold = Math.Max(0, bonusGoldTotal),
            TotalGold = total,
            Breakdown = breakdown
        });
    }

    private static long CalculateExpToNextLevel(int level)
    {
        return (long)Math.Floor(80 + Math.Pow(level, 2.05) * 3.5 + level * 6);
    }

    private static List<GemEntry> ParseGemJson(string? json)
    {
        if (string.IsNullOrEmpty(json))
        {
            return new List<GemEntry>();
        }
        try
        {
            return JsonSerializer.Deserialize<List<GemEntry>>(json) ?? new List<GemEntry>();
        }
        catch
        {
            return new List<GemEntry>();
        }
    }

    private static List<AffixEntry> ParseAffixJson(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<AffixEntry>>(json) ?? new List<AffixEntry>();
        }
        catch
        {
            return new List<AffixEntry>();
        }
    }

    private static void ApplyAffixBonus(AffixEntry affix,
        ref int attack, ref double attackSpeedMs, ref int maxHealth, ref int range,
        ref double defense, ref double critRate, ref double critDamage, ref int physicalPenetration,
        ref double lifestealPercent, ref int lifestealFlat, ref double goldBonus, ref double expBonus,
        ref double burnChance, ref int burnDamage, ref int burnDurationMs,
        ref double poisonChance, ref int poisonDamage, ref int poisonDurationMs,
        ref double freezeChance, ref double freezeSlowAmount, ref int freezeDurationMs,
        ref double lightningChance, ref int lightningChain, ref int lightningDamage,
        ref double resistance, ref double regenPerSec, Dictionary<string, double> elementalBonuses)
    {
        var value = affix.Value;
        switch (affix.Stat?.ToLowerInvariant())
        {
            case "attack":
                attack += (int)Math.Floor(value);
                break;
            case "attackspeed":
                attackSpeedMs *= (1.0 - value / 100.0);
                break;
            case "maxhealth":
            case "health":
                maxHealth += (int)Math.Floor(value);
                break;
            case "range":
                range += (int)Math.Floor(value);
                break;
            case "defense":
                defense += value;
                break;
            case "critrate":
                critRate += value / 100.0;
                break;
            case "critdamage":
                critDamage += value / 100.0;
                break;
            case "physicalpenetration":
            case "pierce":
                physicalPenetration += (int)Math.Floor(value);
                break;
            case "lifestealpercent":
                lifestealPercent += value / 100.0;
                break;
            case "lifestealflat":
                lifestealFlat += (int)Math.Floor(value);
                break;
            case "goldbonus":
                goldBonus += value;
                break;
            case "expbonus":
                expBonus += value;
                break;
            case "burnchance":
                burnChance += value / 100.0;
                break;
            case "burndamage":
                burnDamage += (int)Math.Floor(value);
                break;
            case "burnduration":
                burnDurationMs += (int)Math.Floor(value);
                break;
            case "poisonchance":
                poisonChance += value / 100.0;
                break;
            case "poisondamage":
                poisonDamage += (int)Math.Floor(value);
                break;
            case "poisonduration":
                poisonDurationMs += (int)Math.Floor(value);
                break;
            case "freezechance":
                freezeChance += value / 100.0;
                break;
            case "freezeslow":
                freezeSlowAmount += value / 100.0;
                break;
            case "freezeduration":
                freezeDurationMs += (int)Math.Floor(value);
                break;
            case "lightningchance":
                lightningChance += value / 100.0;
                break;
            case "lightningchain":
                lightningChain += (int)Math.Floor(value);
                break;
            case "lightningdamage":
                lightningDamage += (int)Math.Floor(value);
                break;
            case "resistance":
                resistance += value / 100.0;
                break;
            case "regen":
            case "regenpersecond":
                regenPerSec += value;
                break;
            case "firedamage":
            case "waterdamage":
            case "earthdamage":
            case "winddamage":
            case "lightningdamagebonus":
                if (!elementalBonuses.ContainsKey(affix.Stat))
                    elementalBonuses[affix.Stat] = 0;
                elementalBonuses[affix.Stat] += value;
                break;
        }
    }

    private class GemEntry
    {
        public string Type { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    private class AffixEntry
    {
        public string? Stat { get; set; }
        public double Value { get; set; }
    }
}
