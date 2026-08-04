namespace ShotsGame.Core.DTOs.Lottery;

/// <summary>
/// 水果机状态出参
/// </summary>
public class LotteryOutput
{
    /// <summary>
    /// 当前拥有的抽奖币数量
    /// </summary>
    public int LotteryCoins { get; set; }

    /// <summary>
    /// 今日是否已发放过每日抽奖币
    /// </summary>
    public bool CoinsGivenToday { get; set; }

    /// <summary>
    /// 连续登录天数
    /// </summary>
    public int ConsecutiveLoginDays { get; set; }

    /// <summary>
    /// 今日登录奖励金币数
    /// </summary>
    public long TodayLoginBonusGold { get; set; }

    /// <summary>
    /// 当前押注情况（键为押注类别，值为押注金额）
    /// </summary>
    public Dictionary<string, int> Bets { get; set; } = new();

    /// <summary>
    /// 历史结果索引列表
    /// </summary>
    public List<int> History { get; set; } = new();

    /// <summary>
    /// 剩余免费旋转次数
    /// </summary>
    public int FreeSpins { get; set; }

    /// <summary>
    /// 幸运未中计数器（达到阈值触发幸运机制）
    /// </summary>
    public int LuckyMissCounter { get; set; }

    /// <summary>
    /// 锦标赛最佳成绩
    /// </summary>
    public int TournamentBest { get; set; }

    /// <summary>
    /// 上次中奖金额
    /// </summary>
    public int LastWinAmount { get; set; }
}

/// <summary>
/// 押注入参
/// </summary>
public class PlaceBetInput
{
    /// <summary>
    /// 押注类别（如苹果、橙子等）
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 押注金额
    /// </summary>
    public int Amount { get; set; }
}

/// <summary>
/// 批量押注入参
/// </summary>
public class PlaceBetsBatchInput
{
    /// <summary>
    /// 批量押注项列表
    /// </summary>
    public List<BetItem> Bets { get; set; } = new();

    /// <summary>
    /// 押注项
    /// </summary>
    public class BetItem
    {
        /// <summary>
        /// 押注类别
        /// </summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// 押注金额
        /// </summary>
        public int Amount { get; set; }
    }
}

/// <summary>
/// 取消押注入参
/// </summary>
public class CancelBetInput
{
    /// <summary>
    /// 要取消押注的类别
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 取消押注的金额（为空则取消该类别全部押注）
    /// </summary>
    public int? Amount { get; set; }
}

/// <summary>
/// 清空押注出参
/// </summary>
public class ClearBetsOutput
{
    /// <summary>
    /// 退还的抽奖币数量
    /// </summary>
    public int RefundedCoins { get; set; }
}

/// <summary>
/// 旋转结果出参
/// </summary>
public class SpinOutput
{
    /// <summary>
    /// 结果索引
    /// </summary>
    public int ResultIndex { get; set; }

    /// <summary>
    /// 结果类别名称
    /// </summary>
    public string ResultCategory { get; set; } = string.Empty;

    /// <summary>
    /// 中奖类别列表
    /// </summary>
    public List<string> WinCategories { get; set; } = new();

    /// <summary>
    /// 赢得的抽奖币数量
    /// </summary>
    public int WinCoins { get; set; }

    /// <summary>
    /// 是否触发了幸运机制
    /// </summary>
    public bool LuckyTriggered { get; set; }

    /// <summary>
    /// 幸运附加小游戏名称
    /// </summary>
    public string? LuckySubGame { get; set; }

    /// <summary>
    /// 是否触发 BAR 免费旋转
    /// </summary>
    public bool BarFreeSpin { get; set; }

    /// <summary>
    /// 更新后的幸运未中计数器
    /// </summary>
    public int NewLuckyMissCounter { get; set; }
}

/// <summary>
/// 发放每日硬币出参
/// </summary>
public class GiveDailyCoinsOutput
{
    /// <summary>
    /// 发放的抽奖币数量
    /// </summary>
    public int CoinsGiven { get; set; }

    /// <summary>
    /// 额外奖励的金币数量
    /// </summary>
    public long BonusGold { get; set; }

    /// <summary>
    /// 更新后的连续登录天数
    /// </summary>
    public int ConsecutiveLoginDays { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}
