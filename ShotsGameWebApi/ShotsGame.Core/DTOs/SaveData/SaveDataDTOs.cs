using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Talent;
using ShotsGame.Core.DTOs.Mail;
using ShotsGame.Core.DTOs.Codex;
using ShotsGame.Core.DTOs.Achievement;

namespace ShotsGame.Core.DTOs.SaveData;

/// <summary>
/// 存档出参
/// </summary>
public class SaveDataOutput
{
    /// <summary>
    /// 存档版本号
    /// </summary>
    public int Version { get; set; }

    /// <summary>
    /// 存档保存时间
    /// </summary>
    public DateTimeOffset SavedAt { get; set; }

    /// <summary>
    /// 玩家数据（JSON 字符串）
    /// </summary>
    public string? PlayerJson { get; set; }

    /// <summary>
    /// 游戏状态数据（JSON 字符串）
    /// </summary>
    public string? GameStateJson { get; set; }

    /// <summary>
    /// 装备数据（JSON 字符串）
    /// </summary>
    public string? EquipmentJson { get; set; }

    /// <summary>
    /// 技能数据（JSON 字符串）
    /// </summary>
    public string? SkillsJson { get; set; }

    /// <summary>
    /// 天赋数据（JSON 字符串）
    /// </summary>
    public string? TalentsJson { get; set; }

    /// <summary>
    /// 背包数据（JSON 字符串）
    /// </summary>
    public string? InventoryJson { get; set; }

    /// <summary>
    /// 邮件数据（JSON 字符串）
    /// </summary>
    public string? MailsJson { get; set; }

    /// <summary>
    /// 其他杂项数据（JSON 字符串）
    /// </summary>
    public string? OthersJson { get; set; }
}

/// <summary>
/// 完整存档出参
/// </summary>
public class FullSaveDataOutput
{
    /// <summary>
    /// 玩家基础存档数据
    /// </summary>
    public PlayerSaveData Player { get; set; } = new();

    /// <summary>
    /// 游戏状态存档数据
    /// </summary>
    public GameStateSaveData GameState { get; set; } = new();

    /// <summary>
    /// 当前已装备的装备列表
    /// </summary>
    public List<EquipmentOutput> Equipment { get; set; } = new();

    /// <summary>
    /// 装备仓库中的装备列表
    /// </summary>
    public List<EquipmentOutput> EquipmentStorage { get; set; } = new();

    /// <summary>
    /// 背包中的道具列表
    /// </summary>
    public List<ItemStackOutput> Inventory { get; set; } = new();

    /// <summary>
    /// 已学习的技能存档列表
    /// </summary>
    public List<SkillSaveData> Skills { get; set; } = new();

    /// <summary>
    /// 已获得的天赋列表
    /// </summary>
    public List<TalentOutput> Talents { get; set; } = new();

    /// <summary>
    /// 图鉴条目列表
    /// </summary>
    public List<CodexEntryOutput> CodexEntries { get; set; } = new();

    /// <summary>
    /// 成就进度列表
    /// </summary>
    public List<AchievementOutput> Achievements { get; set; } = new();

    /// <summary>
    /// 邮件列表
    /// </summary>
    public List<MailOutput> Mails { get; set; } = new();

    /// <summary>
    /// 历史最高波次记录
    /// </summary>
    public int HighestWave { get; set; }

    /// <summary>
    /// 签到存档数据
    /// </summary>
    public CheckInSaveData CheckIn { get; set; } = new();

    /// <summary>
    /// 在线奖励存档数据
    /// </summary>
    public OnlineRewardSaveData OnlineRewards { get; set; } = new();

    /// <summary>
    /// 抽奖存档数据
    /// </summary>
    public LotterySaveData Lottery { get; set; } = new();

    /// <summary>
    /// 存档保存时间
    /// </summary>
    public DateTimeOffset SavedAt { get; set; }

    /// <summary>
    /// 存档版本号
    /// </summary>
    public int Version { get; set; } = 1;
}

/// <summary>
/// 玩家存档数据
/// </summary>
public class PlayerSaveData
{
    /// <summary>
    /// 玩家等级
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// 当前经验值
    /// </summary>
    public long Exp { get; set; }

    /// <summary>
    /// 升级到下一级所需经验
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
}

/// <summary>
/// 游戏状态存档数据
/// </summary>
public class GameStateSaveData
{
    /// <summary>
    /// 当前游戏进行到的波次
    /// </summary>
    public int CurrentWave { get; set; }
}

/// <summary>
/// 技能存档数据
/// </summary>
public class SkillSaveData
{
    /// <summary>
    /// 技能ID
    /// </summary>
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// 技能当前等级
    /// </summary>
    public int Level { get; set; }
}

/// <summary>
/// 签到存档数据
/// </summary>
public class CheckInSaveData
{
    /// <summary>
    /// 本周已签到的日期索引列表
    /// </summary>
    public List<int> CheckInDays { get; set; } = new();

    /// <summary>
    /// 周标识键（格式如 2024-W01）
    /// </summary>
    public string WeekKey { get; set; } = string.Empty;

    /// <summary>
    /// 连续签到天数
    /// </summary>
    public int ConsecutiveDays { get; set; }
}

/// <summary>
/// 在线奖励存档数据
/// </summary>
public class OnlineRewardSaveData
{
    /// <summary>
    /// 当日累计在线时长（分钟）
    /// </summary>
    public int OnlineMinutes { get; set; }

    /// <summary>
    /// 已领取的最高档位等级
    /// </summary>
    public int ClaimedLevel { get; set; }
}

/// <summary>
/// 抽奖存档数据
/// </summary>
public class LotterySaveData
{
    /// <summary>
    /// 当前拥有的抽奖币数量
    /// </summary>
    public int LotteryCoins { get; set; }

    /// <summary>
    /// 当前押注情况（JSON 字符串）
    /// </summary>
    public string? BetsJson { get; set; }

    /// <summary>
    /// 连续登录天数
    /// </summary>
    public int ConsecutiveLoginDays { get; set; }

    /// <summary>
    /// 剩余免费旋转次数
    /// </summary>
    public int FreeSpins { get; set; }

    /// <summary>
    /// 幸运未中计数器（用于幸运机制）
    /// </summary>
    public int LuckyMissCounter { get; set; }
}

/// <summary>
/// 保存存档入参
/// </summary>
public class SaveGameInput
{
    /// <summary>
    /// 序列化后的存档数据字符串
    /// </summary>
    public string SaveData { get; set; } = string.Empty;

    /// <summary>
    /// 存档版本号
    /// </summary>
    public int Version { get; set; } = 1;
}

/// <summary>
/// 保存结果出参
/// </summary>
public class SaveGameOutput
{
    /// <summary>
    /// 保存是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 存档保存时间
    /// </summary>
    public DateTimeOffset SavedAt { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}

/// <summary>
/// 读取存档出参
/// </summary>
public class LoadGameOutput
{
    /// <summary>
    /// 是否存在存档
    /// </summary>
    public bool HasSave { get; set; }

    /// <summary>
    /// 序列化后的存档数据字符串
    /// </summary>
    public string? SaveData { get; set; }

    /// <summary>
    /// 存档版本号
    /// </summary>
    public int? Version { get; set; }

    /// <summary>
    /// 存档保存时间
    /// </summary>
    public DateTimeOffset? SavedAt { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}

/// <summary>
/// 重置存档出参
/// </summary>
public class ResetSaveOutput
{
    /// <summary>
    /// 重置是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 提示信息
    /// </summary>
    public string? Message { get; set; }
}
