using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Pk;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// PK对战服务实现：查询在线玩家列表、上报PK结果、更新玩家PK统计与对战记录
/// </summary>
public class PkService : IPkService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<PkRecord> _pkRecordRepository;
    private readonly IRepository<SaveDataSnapshot> _saveSnapshotRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;
    private readonly IOnlinePresenceService _onlinePresenceService;

    public PkService(
        IPlayerRepository playerRepository,
        IRepository<PkRecord> pkRecordRepository,
        IRepository<SaveDataSnapshot> saveSnapshotRepository,
        GameDbContext context,
        IMapper mapper,
        IOnlinePresenceService onlinePresenceService)
    {
        _playerRepository = playerRepository;
        _pkRecordRepository = pkRecordRepository;
        _saveSnapshotRepository = saveSnapshotRepository;
        _context = context;
        _mapper = mapper;
        _onlinePresenceService = onlinePresenceService;
    }

    /// <summary>
    /// 获取在线玩家列表（排除自己）：从 OnlinePresenceService 取在线玩家ID，查询 Player 表，计算胜率
    /// </summary>
    /// <param name="currentPlayerId">当前玩家ID</param>
    /// <returns>在线玩家出参列表</returns>
    public async Task<List<OnlinePlayerOutput>> GetOnlinePlayersAsync(string currentPlayerId)
    {
        var onlineIds = _onlinePresenceService.GetOnlinePlayerIds();
        if (onlineIds.Count == 0)
        {
            return new List<OnlinePlayerOutput>();
        }

        // 排除自己
        var targetIds = onlineIds.Where(id => id != currentPlayerId).ToList();
        if (targetIds.Count == 0)
        {
            return new List<OnlinePlayerOutput>();
        }

        var players = await _context.Players
            .Where(p => targetIds.Contains(p.Id) && !p.IsDeleted)
            .ToListAsync();

        // 手动构造（含计算字段）
        var list = players.Select(p => new OnlinePlayerOutput
        {
            PlayerId = p.Id,
            DisplayName = p.DisplayName,
            Level = p.Level,
            Power = p.Power,
            PkWins = p.PkWins,
            PkLosses = p.PkLosses,
            PkTotal = p.PkTotal,
            PkWinRate = CalcWinRate(p.PkWins, p.PkTotal),
            IsOnline = true,
            LastActiveAt = p.LastActiveAt
        }).ToList();

        return list;
    }

    /// <summary>
    /// 上报PK结果：更新双方 PkWins/PkLosses/PkTotal，创建 PkRecord 记录
    /// </summary>
    /// <param name="challengerId">挑战方玩家ID</param>
    /// <param name="input">上报参数</param>
    /// <returns>对战记录出参；玩家不存在返回 null</returns>
    public async Task<PkRecordOutput?> ReportResultAsync(string challengerId, ReportPkResultInput input)
    {
        var challenger = await _playerRepository.GetProfileAsync(challengerId);
        if (challenger == null)
        {
            return null;
        }

        var defender = await _playerRepository.GetProfileAsync(input.DefenderId);
        if (defender == null)
        {
            return null;
        }

        // 更新双方 PK 统计
        challenger.PkTotal += 1;
        defender.PkTotal += 1;
        if (input.IsWin)
        {
            challenger.PkWins += 1;
            defender.PkLosses += 1;
        }
        else
        {
            challenger.PkLosses += 1;
            defender.PkWins += 1;
        }

        challenger.LastActiveAt = DateTimeOffset.UtcNow;
        defender.LastActiveAt = DateTimeOffset.UtcNow;

        await _playerRepository.UpdateAsync(challenger);
        await _playerRepository.UpdateAsync(defender);

        // 创建对战记录
        var record = new PkRecord
        {
            ChallengerId = challengerId,
            DefenderId = input.DefenderId,
            WinnerId = input.IsWin ? challengerId : input.DefenderId,
            DurationSeconds = input.DurationSeconds,
            PlayedAt = DateTimeOffset.UtcNow
        };
        await _pkRecordRepository.AddAsync(record);

        return new PkRecordOutput
        {
            Id = record.Id,
            ChallengerId = record.ChallengerId,
            ChallengerName = challenger.DisplayName,
            DefenderId = record.DefenderId,
            DefenderName = defender.DisplayName,
            WinnerId = record.WinnerId,
            PlayedAt = record.PlayedAt,
            DurationSeconds = record.DurationSeconds
        };
    }

    /// <summary>
    /// 计算胜率（0-100），总场次为0返回0
    /// </summary>
    private static double CalcWinRate(int wins, int total)
    {
        if (total <= 0)
        {
            return 0;
        }
        return Math.Round(wins * 100.0 / total, 2);
    }

    /// <summary>
    /// 获取指定玩家的真实战斗属性：优先从该玩家最新 SaveDataSnapshot.SaveDataJson 里的 statsSnapshot 节点读取，
    /// 读不到时按 power + level 用估算公式兜底，确保 PK 总能进入战斗。
    /// </summary>
    public async Task<PlayerBattleStatsOutput?> GetPlayerBattleStatsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        // 1) 尝试从最新存档快照中取 statsSnapshot
        var snapshot = await _context.SaveDataSnapshots
            .Where(s => s.PlayerId == playerId && !s.IsDeleted)
            .OrderByDescending(s => s.SavedAt)
            .FirstOrDefaultAsync();

        if (snapshot != null && !string.IsNullOrWhiteSpace(snapshot.SaveDataJson))
        {
            try
            {
                var root = JsonNode.Parse(snapshot.SaveDataJson);
                var statsNode = root?["statsSnapshot"];
                if (statsNode != null)
                {
                    var stats = ExtractStatsFromSnapshot(playerId, statsNode);
                    if (stats != null)
                    {
                        stats.Source = "real";
                        return stats;
                    }
                }
            }
            catch
            {
                // 存档 JSON 损坏或格式不兼容：静默 fallback 到估算公式
            }
        }

        // 2) fallback：用 power + level 推导（和前端旧公式保持一致，避免数值跳变）
        return FallbackFromPowerAndLevel(player);
    }

    private static PlayerBattleStatsOutput ExtractStatsFromSnapshot(string playerId, JsonNode s)
    {
        // GameEngine.saveGame() 里 statsSnapshot 记录的口径：
        //  - attackSpeed：毫秒/次（和 engine 一致），这里要转成「次/秒」返回给前端
        //  - critRate：百分数（如 15 = 15%），转成小数 0.15
        //  - critDamage：百分数（50 = 150% 倍率），转成倍率 1.5
        var attackSpeedMs = s["attackSpeed"]?.GetValue<int?>() ?? 1000;
        var critRatePct = s["critRate"]?.GetValue<double?>() ?? 10;
        var critDamagePct = s["critDamage"]?.GetValue<double?>() ?? 50;

        var elementalBonus = s["elementalDamageBonus"];
        int GetInt(string key, int def = 0) => s[key]?.GetValue<int?>() ?? def;

        return new PlayerBattleStatsOutput
        {
            PlayerId = playerId,

            Attack = GetInt("attack", 10),
            AttackSpeed = attackSpeedMs <= 0 ? 1 : Math.Round(1000.0 / attackSpeedMs, 4),
            MaxHealth = GetInt("maxHealth", 100),
            CritRate = Math.Max(0, Math.Min(0.9, Math.Round(critRatePct / 100.0, 4))),
            CritDamage = Math.Max(1.0, Math.Round(1 + critDamagePct / 100.0, 4)),
            Defense = GetInt("defense"),
            Range = GetInt("range", 1),
            PhysicalPenetration = GetInt("physicalPenetration"),
            Resistance = GetInt("resistance"),

            FireDamageBonus      = elementalBonus?["fire"]?.GetValue<int?>()      ?? GetInt("fireDamageBonus"),
            IceDamageBonus       = elementalBonus?["ice"]?.GetValue<int?>()       ?? GetInt("iceDamageBonus"),
            LightningDamageBonus = elementalBonus?["lightning"]?.GetValue<int?>() ?? GetInt("lightningDamageBonus"),
            PoisonDamageBonus    = elementalBonus?["poison"]?.GetValue<int?>()    ?? GetInt("poisonDamageBonus"),

            FireResistance      = GetInt("fireResistance"),
            IceResistance       = GetInt("iceResistance"),
            LightningResistance = GetInt("lightningResistance"),
            PoisonResistance    = GetInt("poisonResistance"),

            Source = "real"
        };
    }

    private static PlayerBattleStatsOutput FallbackFromPowerAndLevel(Player player)
    {
        var power = (double)(player.Power > 0 ? player.Power : player.Level * 10);
        var level = player.Level;

        // 和前端 deriveOpponentStats 保持一致
        return new PlayerBattleStatsOutput
        {
            PlayerId = player.Id,
            Attack = (int)Math.Round(power * 0.05 + level * 2 + 10),
            AttackSpeed = Math.Round(Math.Min(2.5, 0.8 + level * 0.03), 4),
            MaxHealth = (int)Math.Round(power * 0.1 + level * 20 + 100),
            CritRate = Math.Round(Math.Min(0.5, 0.1 + level * 0.005), 4),
            CritDamage = Math.Round(1.5 + level * 0.02, 4),
            Defense = (int)Math.Round(power * 0.02 + level * 1 + 5),
            Range = 1,
            PhysicalPenetration = 0,
            Resistance = 0,

            FireDamageBonus = 0,
            IceDamageBonus = 0,
            LightningDamageBonus = 0,
            PoisonDamageBonus = 0,

            FireResistance = 0,
            IceResistance = 0,
            LightningResistance = 0,
            PoisonResistance = 0,

            Source = "fallback"
        };
    }
}
