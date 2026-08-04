namespace ShotsGame.Core.DTOs.HorseRacing;

/// <summary>
/// 赛马出参
/// </summary>
public class HorseOutput
{
    /// <summary>
    /// 赛马唯一ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 赛马名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 赛马外观颜色
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// 赔率（投注金额乘以赔率为赢取金额）
    /// </summary>
    public double Odds { get; set; }
}

/// <summary>
/// 轮次出参
/// </summary>
public class RaceRoundOutput
{
    /// <summary>
    /// 第几轮比赛（从1开始）
    /// </summary>
    public int Round { get; set; }

    /// <summary>
    /// 本轮参赛马匹列表
    /// </summary>
    public List<HorseOutput> Horses { get; set; } = new();

    /// <summary>
    /// 本轮获胜马匹列表
    /// </summary>
    public List<HorseOutput> Winners { get; set; } = new();

    /// <summary>
    /// 本轮比赛状态（未开始/进行中/已结束）
    /// </summary>
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// 赛会出参
/// </summary>
public class RaceSessionOutput
{
    /// <summary>
    /// 比赛会话唯一标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 参赛马匹列表
    /// </summary>
    public List<HorseOutput> Horses { get; set; } = new();

    /// <summary>
    /// 各轮次比赛结果
    /// </summary>
    public List<RaceRoundOutput> Rounds { get; set; } = new();

    /// <summary>
    /// 玩家押注情况（键为赛马ID，值为押注金额）
    /// </summary>
    public Dictionary<int, long> Bets { get; set; } = new();

    /// <summary>
    /// 玩家押注总金额
    /// </summary>
    public long TotalBet { get; set; }

    /// <summary>
    /// 赛会状态（未开始/进行中/已结束）
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 冠军马匹（比赛结束时有值）
    /// </summary>
    public HorseOutput? Champion { get; set; }

    /// <summary>
    /// 玩家赢得金币数
    /// </summary>
    public long GoldWon { get; set; }
}

/// <summary>
/// 下注入参
/// </summary>
public class PlaceHorseBetInput
{
    /// <summary>
    /// 要押注的赛马ID
    /// </summary>
    public int HorseId { get; set; }

    /// <summary>
    /// 押注金额
    /// </summary>
    public long Amount { get; set; }
}

/// <summary>
/// 取消下注入参
/// </summary>
public class CancelHorseBetInput
{
    /// <summary>
    /// 要取消押注的赛马ID
    /// </summary>
    public int HorseId { get; set; }

    /// <summary>
    /// 取消押注的金额（为空则取消该赛马全部押注）
    /// </summary>
    public long? Amount { get; set; }
}

/// <summary>
/// 开始比赛出参
/// </summary>
public class StartRaceOutput
{
    /// <summary>
    /// 比赛会话唯一标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 比赛开始倒计时（秒）
    /// </summary>
    public int Countdown { get; set; } = 5;
}

/// <summary>
/// 比赛结果出参
/// </summary>
public class RaceResultOutput
{
    /// <summary>
    /// 比赛会话唯一标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 冠军马匹
    /// </summary>
    public HorseOutput? Champion { get; set; }

    /// <summary>
    /// 玩家赢得金币数
    /// </summary>
    public long GoldWon { get; set; }

    /// <summary>
    /// 押注总金额
    /// </summary>
    public long BetsTotal { get; set; }

    /// <summary>
    /// 中奖押注对应的赛马ID列表
    /// </summary>
    public List<int> WinBets { get; set; } = new();
}
