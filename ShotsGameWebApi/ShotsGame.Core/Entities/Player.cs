namespace ShotsGame.Core.Entities;

/// <summary>
/// 玩家：包含认证信息与游戏档案
/// </summary>
public class Player : BaseEntity
{
    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;
    /// <summary>
    /// 密码哈希值
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;
    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;
    /// <summary>
    /// 头像地址
    /// </summary>
    public string? AvatarUrl { get; set; }
    /// <summary>
    /// 邮箱地址
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 玩家等级
    /// </summary>
    public int Level { get; set; } = 1;
    /// <summary>
    /// 当前经验值
    /// </summary>
    public long Exp { get; set; } = 0;
    /// <summary>
    /// 下一等级所需经验值
    /// </summary>
    public long ExpToNextLevel { get; set; } = 100;
    /// <summary>
    /// 拥有金币数
    /// </summary>
    public long Gold { get; set; } = 0;
    /// <summary>
    /// 总积分
    /// </summary>
    public long Score { get; set; } = 0;
    /// <summary>
    /// 可用技能点数
    /// </summary>
    public int SkillPoints { get; set; } = 0;

    /// <summary>
    /// 最高到达波次
    /// </summary>
    public int MaxWave { get; set; } = 0;
    /// <summary>
    /// 总击杀数
    /// </summary>
    public int TotalKills { get; set; } = 0;
    /// <summary>
    /// 总战斗次数
    /// </summary>
    public int TotalBattles { get; set; } = 0;
    /// <summary>
    /// 总胜利次数
    /// </summary>
    public int TotalVictories { get; set; } = 0;

    /// <summary>PK胜场</summary>
    public int PkWins { get; set; } = 0;
    /// <summary>PK负场</summary>
    public int PkLosses { get; set; } = 0;
    /// <summary>PK总场次</summary>
    public int PkTotal { get; set; } = 0;
    /// <summary>战斗力（客户端上报缓存值，用于排行榜）</summary>
    public long Power { get; set; } = 0;
    /// <summary>当前关卡挑战最大关卡</summary>
    public int MaxStage { get; set; } = 0;

    /// <summary>
    /// 上次活跃时间
    /// </summary>
    public DateTimeOffset LastActiveAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 玩家装备列表
    /// </summary>
    public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
    /// <summary>
    /// 玩家背包道具列表
    /// </summary>
    public ICollection<ItemStack> Inventory { get; set; } = new List<ItemStack>();
    /// <summary>
    /// 战斗记录列表
    /// </summary>
    public ICollection<BattleRecord> BattleRecords { get; set; } = new List<BattleRecord>();
    /// <summary>
    /// 抽奖记录列表
    /// </summary>
    public ICollection<LotteryRecord> LotteryRecords { get; set; } = new List<LotteryRecord>();
    /// <summary>
    /// 赛马会话列表
    /// </summary>
    public ICollection<HorseRaceSession> HorseRaceSessions { get; set; } = new List<HorseRaceSession>();
    /// <summary>
    /// 存档快照列表
    /// </summary>
    public ICollection<SaveDataSnapshot> SaveDataSnapshots { get; set; } = new List<SaveDataSnapshot>();
    /// <summary>
    /// 答题记录列表
    /// </summary>
    public ICollection<QuizAttempt> QuizAttempts { get; set; } = new List<QuizAttempt>();
    /// <summary>
    /// 抽奖罐记录列表
    /// </summary>
    public ICollection<LotteryPotRecord> LotteryPotRecords { get; set; } = new List<LotteryPotRecord>();
}
