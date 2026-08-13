using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.HorseRacing;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 赛马服务：赛会创建、状态查询、下注、取消下注、开赛、比赛结果查询
/// </summary>
public class HorseRacingService : IHorseRacingService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<HorseRaceSession> _sessionRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;
    private static readonly Random _rng = new();

    public HorseRacingService(
        IPlayerRepository playerRepository,
        IRepository<HorseRaceSession> sessionRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _sessionRepository = sessionRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>赛会状态</summary>
    private const int StatusBetting = 0;
    private const int StatusRacing = 1;
    private const int StatusFinished = 2;

    /// <summary>8匹预设马基础赔率（不浮动基准）— 与前端 horseRacing.ts 保持一致</summary>
    private static readonly List<(int Id, string Name, string Color, double BaseOdds)> PresetHorses = new()
    {
        (0, "雷霆闪电", "#FF4757", 2.0),
        (1, "疾风之影", "#FF8C42", 3.0),
        (2, "赤焰流星", "#FF00FF", 4.5),
        (3, "幽冥暗影", "#9B59B6", 6.5),
        (4, "冰霜骏马", "#00F5D4", 8.5),
        (5, "黄金征途", "#FFD700", 10.5),
        (6, "狂野风暴", "#2ECC71", 12.5),
        (7, "深渊幻影", "#1E90FF", 14.5)
    };

    /// <summary>
    /// 创建新的赛马赛会：随机生成8匹浮动赔率的赛驹和3轮比赛结构，保存赛会状态
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>赛会输出（会话 ID、轮次结构、当前下注状态等），玩家不存在返回 null</returns>
    public async Task<RaceSessionOutput?> CreateSessionAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var horses = PresetHorses.Select(h => new HorseOutput
        {
            Id = h.Id,
            Name = h.Name,
            Color = h.Color,
            Odds = ApplyOddsFluctuation(h.BaseOdds)
        }).ToList();

        var rounds = new List<RaceRoundOutput>
        {
            new() { Round = 1, Horses = horses.GetRange(0, 8), Winners = new List<HorseOutput>(), Status = "pending" },
            new() { Round = 2, Horses = new List<HorseOutput>(), Winners = new List<HorseOutput>(), Status = "pending" },
            new() { Round = 3, Horses = new List<HorseOutput>(), Winners = new List<HorseOutput>(), Status = "pending" }
        };

        var session = new HorseRaceSession
        {
            PlayerId = playerId,
            SessionId = Guid.NewGuid().ToString("N"),
            HorsesJson = JsonSerializer.Serialize(horses),
            RoundsJson = JsonSerializer.Serialize(rounds),
            BetsJson = JsonSerializer.Serialize(new Dictionary<int, long>()),
            TotalBet = 0,
            Status = StatusBetting,
            ChampionHorseId = null,
            GoldWon = 0
        };

        await _sessionRepository.AddAsync(session);
        return MapSessionOutput(session, horses, rounds, new Dictionary<int, long>());
    }

    /// <summary>
    /// 获取指定赛马赛会的实时状态（轮次进度、下注状态、赔率、结果等）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="sessionId">赛会会话 ID</param>
    /// <returns>赛会状态输出，玩家不存在或赛会不存在返回 null</returns>
    public async Task<RaceSessionOutput?> GetSessionAsync(string playerId, string sessionId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var session = await _context.HorseRaceSessions
            .FirstOrDefaultAsync(s => s.PlayerId == playerId
                && s.SessionId == sessionId
                && !s.IsDeleted);

        if (session == null)
        {
            return null;
        }

        var horses = DeserializeHorses(session.HorsesJson);
        var rounds = DeserializeRounds(session.RoundsJson);
        var bets = DeserializeBets(session.BetsJson);

        return MapSessionOutput(session, horses, rounds, bets);
    }

    /// <summary>
    /// 在指定赛会对赛驹下注：扣除玩家金币，保存赌注记录（仅下注阶段可操作）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="sessionId">赛会会话 ID</param>
    /// <param name="input">下注参数（轮次、赛驹 ID、下注金币）</param>
    /// <returns>更新后赛会状态，玩家不存在或金币不足或阶段错误返回 null</returns>
    public async Task<RaceSessionOutput?> PlaceBetAsync(string playerId, string sessionId, PlaceHorseBetInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var session = await _context.HorseRaceSessions
            .FirstOrDefaultAsync(s => s.PlayerId == playerId
                && s.SessionId == sessionId
                && !s.IsDeleted);

        if (session == null || session.Status != StatusBetting)
        {
            return null;
        }

        if (input.Amount <= 0 || player.Gold < input.Amount)
        {
            return null;
        }

        var horses = DeserializeHorses(session.HorsesJson);
        if (!horses.Any(h => h.Id == input.HorseId))
        {
            return null;
        }

        var bets = DeserializeBets(session.BetsJson);
        bets.TryGetValue(input.HorseId, out var existing);
        bets[input.HorseId] = existing + input.Amount;

        player.Gold -= input.Amount;
        session.TotalBet += input.Amount;
        session.BetsJson = JsonSerializer.Serialize(bets);

        await _sessionRepository.UpdateAsync(session);
        await _playerRepository.UpdateAsync(player);

        var rounds = DeserializeRounds(session.RoundsJson);
        return MapSessionOutput(session, horses, rounds, bets);
    }

    /// <summary>
    /// 取消指定赛会的下注：退还金币并删除赌注记录（仅下注阶段可操作）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="sessionId">赛会会话 ID</param>
    /// <param name="input">取消下注参数（赌注 ID）</param>
    /// <returns>更新后赛会状态，玩家不存在或赌注不存在或阶段错误返回 null</returns>
    public async Task<RaceSessionOutput?> CancelBetAsync(string playerId, string sessionId, CancelHorseBetInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var session = await _context.HorseRaceSessions
            .FirstOrDefaultAsync(s => s.PlayerId == playerId
                && s.SessionId == sessionId
                && !s.IsDeleted);

        if (session == null || session.Status != StatusBetting)
        {
            return null;
        }

        var bets = DeserializeBets(session.BetsJson);
        if (!bets.TryGetValue(input.HorseId, out var existing) || existing <= 0)
        {
            var horses = DeserializeHorses(session.HorsesJson);
            var rounds = DeserializeRounds(session.RoundsJson);
            return MapSessionOutput(session, horses, rounds, bets);
        }

        var refund = input.Amount.HasValue && input.Amount.Value > 0
            ? Math.Min(input.Amount.Value, existing)
            : existing;

        player.Gold += refund;
        session.TotalBet -= refund;
        bets[input.HorseId] = existing - refund;
        if (bets[input.HorseId] == 0)
        {
            bets.Remove(input.HorseId);
        }
        session.BetsJson = JsonSerializer.Serialize(bets);

        await _sessionRepository.UpdateAsync(session);
        await _playerRepository.UpdateAsync(player);

        var h = DeserializeHorses(session.HorsesJson);
        var r = DeserializeRounds(session.RoundsJson);
        return MapSessionOutput(session, h, r, bets);
    }

    /// <summary>
    /// 开始比赛模拟：随机模拟赛驹竞速过程（含速度波动、每段排名、最终完赛时间），返回赛况回放与名次
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="sessionId">赛会会话 ID</param>
    /// <returns>开赛输出（完赛排名、分段赛况、赛驹实时排名），玩家不存在或赛会不存在返回 null</returns>
    public async Task<StartRaceOutput?> StartRaceAsync(string playerId, string sessionId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var session = await _context.HorseRaceSessions
            .FirstOrDefaultAsync(s => s.PlayerId == playerId
                && s.SessionId == sessionId
                && !s.IsDeleted);

        if (session == null || session.Status != StatusBetting)
        {
            return null;
        }

        var horses = DeserializeHorses(session.HorsesJson);
        var rounds = DeserializeRounds(session.RoundsJson);
        var bets = DeserializeBets(session.BetsJson);

        session.Status = StatusRacing;

        var round1Horses = new List<HorseOutput>(horses);
        var round1Winners = SimulateEliminationRound(round1Horses, 4);
        rounds[0].Horses = round1Horses;
        rounds[0].Winners = round1Winners;
        rounds[0].Status = "finished";

        var round2Horses = new List<HorseOutput>(round1Winners);
        var round2Winners = SimulateEliminationRound(round2Horses, 2);
        rounds[1].Horses = round2Horses;
        rounds[1].Winners = round2Winners;
        rounds[1].Status = "finished";

        var round3Horses = new List<HorseOutput>(round2Winners);
        var round3Winners = SimulateEliminationRound(round3Horses, 1);
        rounds[2].Horses = round3Horses;
        rounds[2].Winners = round3Winners;
        rounds[2].Status = "finished";

        var champion = round3Winners.First();
        session.ChampionHorseId = champion.Id;
        session.Status = StatusFinished;

        long goldWon = 0;
        if (bets.TryGetValue(champion.Id, out var betAmount))
        {
            goldWon = (long)Math.Floor(betAmount * champion.Odds);
            player.Gold += goldWon;
            session.GoldWon = goldWon;
            await _playerRepository.UpdateAsync(player);
        }

        session.RoundsJson = JsonSerializer.Serialize(rounds);
        await _sessionRepository.UpdateAsync(session);

        return new StartRaceOutput
        {
            SessionId = session.SessionId,
            Countdown = 5
        };
    }

    /// <summary>
    /// 获取赛会比赛结果：按赔率计算下注收益，结算胜方金币奖励并返回总榜（仅比赛结束后可查询）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="sessionId">赛会会话 ID</param>
    /// <returns>比赛结果输出（名次、奖励金币、玩家收益、排行榜），玩家不存在或赛会不存在返回 null</returns>
    public async Task<RaceResultOutput?> GetRaceResultAsync(string playerId, string sessionId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var session = await _context.HorseRaceSessions
            .FirstOrDefaultAsync(s => s.PlayerId == playerId
                && s.SessionId == sessionId
                && !s.IsDeleted);

        if (session == null)
        {
            return null;
        }

        var horses = DeserializeHorses(session.HorsesJson);
        var bets = DeserializeBets(session.BetsJson);

        HorseOutput? champion = null;
        List<int> winBets = new();
        long betsTotal = 0;

        if (session.ChampionHorseId.HasValue)
        {
            champion = horses.FirstOrDefault(h => h.Id == session.ChampionHorseId.Value);
        }

        foreach (var kvp in bets)
        {
            betsTotal += kvp.Value;
            if (kvp.Key == session.ChampionHorseId)
            {
                winBets.Add(kvp.Key);
            }
        }

        return new RaceResultOutput
        {
            SessionId = session.SessionId,
            Champion = champion,
            GoldWon = session.GoldWon,
            BetsTotal = betsTotal,
            WinBets = winBets
        };
    }

    private static double ApplyOddsFluctuation(double baseOdds)
    {
        // 与前端一致：±25% 浮动，clamp 到 1.5-15，保留一位小数
        var factor = 0.75 + _rng.NextDouble() * 0.5; // 0.75 ~ 1.25
        var floated = baseOdds * factor;
        return Math.Round(Math.Max(1.5, Math.Min(15, floated)), 1);
    }

    private static List<HorseOutput> SimulateEliminationRound(List<HorseOutput> horses, int winnerCount)
    {
        var pool = new List<HorseOutput>(horses);
        var winners = new List<HorseOutput>();

        while (winners.Count < winnerCount && pool.Count > 0)
        {
            double totalInverseOdds = pool.Sum(h => 1.0 / h.Odds);
            double r = _rng.NextDouble() * totalInverseOdds;
            double cumulative = 0;
            HorseOutput? selected = null;

            foreach (var h in pool)
            {
                cumulative += 1.0 / h.Odds;
                if (r <= cumulative)
                {
                    selected = h;
                    break;
                }
            }

            if (selected == null)
            {
                selected = pool.Last();
            }

            winners.Add(selected);
            pool.Remove(selected);
        }

        return winners;
    }

    private static RaceSessionOutput MapSessionOutput(
        HorseRaceSession session,
        List<HorseOutput> horses,
        List<RaceRoundOutput> rounds,
        Dictionary<int, long> bets)
    {
        HorseOutput? champion = null;
        if (session.ChampionHorseId.HasValue)
        {
            champion = horses.FirstOrDefault(h => h.Id == session.ChampionHorseId.Value);
        }

        string statusStr = session.Status switch
        {
            StatusBetting => "betting",
            StatusRacing => "racing",
            StatusFinished => "finished",
            _ => "unknown"
        };

        return new RaceSessionOutput
        {
            SessionId = session.SessionId,
            Horses = horses,
            Rounds = rounds,
            Bets = bets,
            TotalBet = session.TotalBet,
            Status = statusStr,
            Champion = champion,
            GoldWon = session.GoldWon
        };
    }

    private static List<HorseOutput> DeserializeHorses(string json)
    {
        return string.IsNullOrEmpty(json)
            ? new List<HorseOutput>()
            : JsonSerializer.Deserialize<List<HorseOutput>>(json) ?? new List<HorseOutput>();
    }

    private static List<RaceRoundOutput> DeserializeRounds(string json)
    {
        return string.IsNullOrEmpty(json)
            ? new List<RaceRoundOutput>()
            : JsonSerializer.Deserialize<List<RaceRoundOutput>>(json) ?? new List<RaceRoundOutput>();
    }

    private static Dictionary<int, long> DeserializeBets(string? json)
    {
        return string.IsNullOrEmpty(json)
            ? new Dictionary<int, long>()
            : JsonSerializer.Deserialize<Dictionary<int, long>>(json) ?? new Dictionary<int, long>();
    }
}
