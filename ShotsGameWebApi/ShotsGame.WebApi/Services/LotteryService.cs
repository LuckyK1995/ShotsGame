using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Lottery;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 水果机（跑马灯）抽奖服务：押注下单、批量押注、取消/清空押注、旋转开奖、每日免费抽奖币领取、Lucky 保底小游戏触发
/// </summary>
public class LotteryService : ILotteryService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<LotteryRecord> _lotteryRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;
    private static readonly Random _rng = new();

    public LotteryService(
        IPlayerRepository playerRepository,
        IRepository<LotteryRecord> lotteryRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _lotteryRepository = lotteryRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>24格跑马灯布局（索引0-23）</summary>
    private static readonly List<string> WheelLayout = new()
    {
        "apple", "orange", "lemon", "cherry",
        "bell", "apple", "bar", "watermelon",
        "orange", "cherry", "bell", "double_star",
        "lemon", "apple", "watermelon", "bar",
        "cherry", "orange", "double_star", "bell",
        "apple", "lemon", "watermelon", "bar"
    };

    /// <summary>8种押注类别及赔率</summary>
    private static readonly Dictionary<string, int> CategoryOdds = new()
    {
        ["apple"] = 5,
        ["orange"] = 8,
        ["lemon"] = 10,
        ["cherry"] = 12,
        ["bell"] = 15,
        ["watermelon"] = 20,
        ["double_star"] = 30,
        ["bar"] = 50
    };

    /// <summary>每种类别单注上限</summary>
    private const int BetPerCategoryMax = 999;

    /// <summary>Lucky保底：连续未中次数阈值</summary>
    private const int LuckyMissThreshold = 30;

    /// <summary>Lucky保底小游戏列表</summary>
    private static readonly List<string> LuckySubGames = new()
    {
        "BonusWheel", "TreasureChest", "LuckyReveal", "MiniJackpot"
    };

    /// <summary>
    /// 获取玩家水果机状态（当前押注、历史记录、剩余抽奖币、今日是否已领免费币、Lucky 未中次数等）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>水果机状态输出，玩家不存在返回 null</returns>
    public async Task<LotteryOutput?> GetLotteryStatusAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateLotteryRecordAsync(playerId);

        var bets = string.IsNullOrEmpty(record.BetsJson)
            ? new Dictionary<string, int>()
            : JsonSerializer.Deserialize<Dictionary<string, int>>(record.BetsJson) ?? new Dictionary<string, int>();

        var history = string.IsNullOrEmpty(record.HistoryJson)
            ? new List<int>()
            : JsonSerializer.Deserialize<List<int>>(record.HistoryJson) ?? new List<int>();

        var today = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");

        return new LotteryOutput
        {
            LotteryCoins = record.LotteryCoins,
            CoinsGivenToday = record.CoinsGivenDate == today,
            ConsecutiveLoginDays = record.ConsecutiveLoginDays,
            TodayLoginBonusGold = 0,
            Bets = bets,
            History = history,
            FreeSpins = record.FreeSpins,
            LuckyMissCounter = record.LuckyMissCounter,
            TournamentBest = record.TournamentBest,
            LastWinAmount = record.LastWinAmount
        };
    }

    /// <summary>
    /// 领取每日免费水果机抽奖币（每日限一次），根据连续登录天数发放不同数量
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>领取结果输出（成功/失败、发放数量、消息），玩家不存在或今日已领取返回 null</returns>
    public async Task<GiveDailyCoinsOutput?> GiveDailyCoinsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateLotteryRecordAsync(playerId);
        var today = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");

        if (record.CoinsGivenDate == today)
        {
            return new GiveDailyCoinsOutput
            {
                CoinsGiven = 0,
                BonusGold = 0,
                ConsecutiveLoginDays = record.ConsecutiveLoginDays,
                Message = "今日硬币已领取"
            };
        }

        var yesterday = DateTimeOffset.UtcNow.AddDays(-1).ToString("yyyy-MM-dd");
        if (record.LastLoginDate == yesterday)
        {
            record.ConsecutiveLoginDays++;
        }
        else if (record.LastLoginDate != today)
        {
            record.ConsecutiveLoginDays = 1;
        }

        var baseCoins = 10;
        var streakBonus = Math.Min(record.ConsecutiveLoginDays / 3, 5);
        var totalCoins = baseCoins + streakBonus;

        long bonusGold = 0;
        string message;
        if (record.ConsecutiveLoginDays >= 7 && record.ConsecutiveLoginDays % 7 == 0)
        {
            bonusGold = 500;
            player.Gold += bonusGold;
            message = $"连续登录{record.ConsecutiveLoginDays}天！额外获得500金币奖励";
        }
        else
        {
            message = $"领取成功！连续登录{record.ConsecutiveLoginDays}天，每3天+1硬币加成（+{streakBonus}）";
        }

        record.LotteryCoins += totalCoins;
        record.CoinsGivenDate = today;
        record.LastLoginDate = today;

        await _lotteryRepository.UpdateAsync(record);
        await _playerRepository.UpdateAsync(player);

        return new GiveDailyCoinsOutput
        {
            CoinsGiven = totalCoins,
            BonusGold = bonusGold,
            ConsecutiveLoginDays = record.ConsecutiveLoginDays,
            Message = message
        };
    }

    /// <summary>
    /// 在指定押注类别下注：扣减抽奖币，设置押注金额（支持追加），超过单类上限失败
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">押注参数（押注类别、金额）</param>
    /// <returns>更新后的水果机状态，玩家不存在或抽奖币不足或类别无效返回 null</returns>
    public async Task<LotteryOutput?> PlaceBetAsync(string playerId, PlaceBetInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (!CategoryOdds.ContainsKey(input.Category))
        {
            return null;
        }

        if (input.Amount <= 0)
        {
            return null;
        }

        var record = await GetOrCreateLotteryRecordAsync(playerId);
        var bets = DeserializeBets(record.BetsJson);

        var currentBet = bets.GetValueOrDefault(input.Category, 0);
        if (currentBet + input.Amount > BetPerCategoryMax)
        {
            return null;
        }

        if (record.LotteryCoins < input.Amount)
        {
            return null;
        }

        record.LotteryCoins -= input.Amount;
        bets[input.Category] = currentBet + input.Amount;
        record.BetsJson = JsonSerializer.Serialize(bets);

        await _lotteryRepository.UpdateAsync(record);
        return await BuildLotteryOutput(record);
    }

    /// <summary>
    /// 批量多类别下注：一次性对多个押注类别分别下注（单笔押注逻辑的批量版本）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">批量押注参数（多个类别与金额的字典）</param>
    /// <returns>更新后的水果机状态，玩家不存在或抽奖币不足返回 null</returns>
    public async Task<LotteryOutput?> PlaceBetsBatchAsync(string playerId, PlaceBetsBatchInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateLotteryRecordAsync(playerId);
        var bets = DeserializeBets(record.BetsJson);

        long totalNeed = 0;
        var tempBets = new Dictionary<string, int>(bets);

        foreach (var item in input.Bets)
        {
            if (!CategoryOdds.ContainsKey(item.Category) || item.Amount <= 0)
            {
                continue;
            }
            var cur = tempBets.GetValueOrDefault(item.Category, 0);
            if (cur + item.Amount > BetPerCategoryMax)
            {
                return null;
            }
            tempBets[item.Category] = cur + item.Amount;
            totalNeed += item.Amount;
        }

        if (record.LotteryCoins < totalNeed)
        {
            return null;
        }

        record.LotteryCoins -= (int)totalNeed;
        record.BetsJson = JsonSerializer.Serialize(tempBets);

        await _lotteryRepository.UpdateAsync(record);
        return await BuildLotteryOutput(record);
    }

    /// <summary>
    /// 取消指定类别的押注：退还该类别全部押注抽奖币
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">取消押注参数（押注类别）</param>
    /// <returns>更新后的水果机状态，玩家不存在或类别无押注返回 null</returns>
    public async Task<LotteryOutput?> CancelBetAsync(string playerId, CancelBetInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateLotteryRecordAsync(playerId);
        var bets = DeserializeBets(record.BetsJson);

        if (!bets.TryGetValue(input.Category, out var current) || current <= 0)
        {
            return await BuildLotteryOutput(record);
        }

        var refund = input.Amount.HasValue && input.Amount.Value > 0
            ? Math.Min(input.Amount.Value, current)
            : current;

        record.LotteryCoins += refund;
        bets[input.Category] = current - refund;
        if (bets[input.Category] == 0)
        {
            bets.Remove(input.Category);
        }
        record.BetsJson = JsonSerializer.Serialize(bets);

        await _lotteryRepository.UpdateAsync(record);
        return await BuildLotteryOutput(record);
    }

    /// <summary>
    /// 清空所有类别押注：退还全部押注抽奖币，返回退还总数
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>清空结果输出（退还抽奖币数量），玩家不存在返回 null</returns>
    public async Task<ClearBetsOutput?> ClearBetsAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateLotteryRecordAsync(playerId);
        var bets = DeserializeBets(record.BetsJson);

        var refunded = bets.Values.Sum();
        record.LotteryCoins += refunded;
        record.BetsJson = JsonSerializer.Serialize(new Dictionary<string, int>());

        await _lotteryRepository.UpdateAsync(record);
        return new ClearBetsOutput { RefundedCoins = refunded };
    }

    /// <summary>
    /// 执行水果机旋转开奖：扣除押注抽奖币，按加权随机生成结果位置，计算中奖赔率并结算，连续未中达阈值触发 Lucky 保底小游戏
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>旋转结果输出（停在位置、中奖类别、赢得金币、Free Spin、Lucky 奖励等），玩家不存在或无押注返回 null</returns>
    public async Task<SpinOutput?> SpinAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var record = await GetOrCreateLotteryRecordAsync(playerId);
        var bets = DeserializeBets(record.BetsJson);
        var totalBet = bets.Values.Sum();

        bool useFreeSpin = false;
        if (totalBet == 0)
        {
            if (record.FreeSpins > 0)
            {
                useFreeSpin = true;
                record.FreeSpins--;
            }
            else
            {
                return null;
            }
        }

        var history = string.IsNullOrEmpty(record.HistoryJson)
            ? new List<int>()
            : JsonSerializer.Deserialize<List<int>>(record.HistoryJson) ?? new List<int>();

        int resultIndex = _rng.Next(0, 24);
        string resultCategory = WheelLayout[resultIndex];

        var winCategories = new List<string>();
        int winCoins = 0;

        if (!useFreeSpin)
        {
            foreach (var kvp in bets)
            {
                if (kvp.Key == resultCategory && CategoryOdds.TryGetValue(kvp.Key, out var odds))
                {
                    winCategories.Add(kvp.Key);
                    winCoins += kvp.Value * odds;
                }
            }

            if (resultCategory == "bar")
            {
                var barCount = bets.GetValueOrDefault("bar", 0);
                if (barCount > 0)
                {
                    record.FreeSpins += 1;
                }
            }
        }
        else
        {
            if (CategoryOdds.TryGetValue(resultCategory, out var odds))
            {
                winCoins = 10 * odds;
                winCategories.Add(resultCategory);
            }
        }

        bool luckyTriggered = false;
        string? luckySubGame = null;
        if (winCoins == 0 && !useFreeSpin)
        {
            record.LuckyMissCounter++;
            if (record.LuckyMissCounter >= LuckyMissThreshold)
            {
                luckyTriggered = true;
                luckySubGame = LuckySubGames[_rng.Next(LuckySubGames.Count)];
                record.LuckyMissCounter = 0;
                var luckyMinWin = totalBet * 3;
                var luckyMaxWin = totalBet * 10;
                winCoins = _rng.Next(luckyMinWin, luckyMaxWin + 1);
            }
        }
        else if (winCoins > 0)
        {
            record.LuckyMissCounter = 0;
        }

        record.LotteryCoins += winCoins;
        record.LastWinAmount = winCoins;

        history.Insert(0, resultIndex);
        if (history.Count > 50)
        {
            history = history.Take(50).ToList();
        }
        record.HistoryJson = JsonSerializer.Serialize(history);
        record.BetsJson = JsonSerializer.Serialize(new Dictionary<string, int>());

        await _lotteryRepository.UpdateAsync(record);

        return new SpinOutput
        {
            ResultIndex = resultIndex,
            ResultCategory = resultCategory,
            WinCategories = winCategories,
            WinCoins = winCoins,
            LuckyTriggered = luckyTriggered,
            LuckySubGame = luckySubGame,
            BarFreeSpin = resultCategory == "bar" && bets.GetValueOrDefault("bar", 0) > 0 && !useFreeSpin,
            NewLuckyMissCounter = record.LuckyMissCounter
        };
    }

    private async Task<LotteryRecord> GetOrCreateLotteryRecordAsync(string playerId)
    {
        var record = await _context.LotteryRecords
            .FirstOrDefaultAsync(r => r.PlayerId == playerId && !r.IsDeleted);

        if (record == null)
        {
            record = new LotteryRecord
            {
                PlayerId = playerId,
                LotteryCoins = 0,
                CoinsGivenDate = string.Empty,
                ConsecutiveLoginDays = 0,
                BetsJson = JsonSerializer.Serialize(new Dictionary<string, int>()),
                HistoryJson = JsonSerializer.Serialize(new List<int>()),
                FreeSpins = 0,
                LuckyMissCounter = 0,
                TournamentBest = 0,
                LastWinAmount = 0
            };
            await _lotteryRepository.AddAsync(record);
        }

        return record;
    }

    private static Dictionary<string, int> DeserializeBets(string? json)
    {
        return string.IsNullOrEmpty(json)
            ? new Dictionary<string, int>()
            : JsonSerializer.Deserialize<Dictionary<string, int>>(json) ?? new Dictionary<string, int>();
    }

    private async Task<LotteryOutput> BuildLotteryOutput(LotteryRecord record)
    {
        var bets = DeserializeBets(record.BetsJson);
        var history = string.IsNullOrEmpty(record.HistoryJson)
            ? new List<int>()
            : JsonSerializer.Deserialize<List<int>>(record.HistoryJson) ?? new List<int>();
        var today = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");

        return new LotteryOutput
        {
            LotteryCoins = record.LotteryCoins,
            CoinsGivenToday = record.CoinsGivenDate == today,
            ConsecutiveLoginDays = record.ConsecutiveLoginDays,
            TodayLoginBonusGold = 0,
            Bets = bets,
            History = history,
            FreeSpins = record.FreeSpins,
            LuckyMissCounter = record.LuckyMissCounter,
            TournamentBest = record.TournamentBest,
            LastWinAmount = record.LastWinAmount
        };
    }
}
