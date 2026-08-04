using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Quiz;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 答题系统服务：每日答题抽题、答案提交批改、结算发放奖励、历史记录查询
/// </summary>
public class QuizService : IQuizService
{
    private static readonly QuestionBankItem[] QuestionBank = new[]
    {
        new QuestionBankItem { Id = 1, Type = "single", Question = "《塞尔达传说：旷野之息》中，主角林克的主要武器是什么？", Options = new[] { "大师剑", "三叉戟", "弓箭", "法杖" }, Correct = new[] { 0 }, Explanation = "大师剑是《塞尔达传说》系列中林克的标志性武器，又称退魔之剑。" },
        new QuestionBankItem { Id = 2, Type = "single", Question = "以下哪个不是MOBA类游戏？", Options = new[] { "英雄联盟", "DOTA2", "王者荣耀", "我的世界" }, Correct = new[] { 3 }, Explanation = "我的世界是沙盒类游戏，其他三个都是MOBA（多人在线战术竞技）游戏。" },
        new QuestionBankItem { Id = 3, Type = "multiple", Question = "以下哪些是《原神》中的可玩角色？（多选）", Options = new[] { "迪卢克", "亚瑟", "刻晴", "安柏" }, Correct = new[] { 0, 2, 3 }, Explanation = "亚瑟是《王者荣耀》的角色，迪卢克、刻晴、安柏都是《原神》中的角色。" },
        new QuestionBankItem { Id = 4, Type = "single", Question = "RPG的中文全称是什么？", Options = new[] { "角色扮演游戏", "即时战略游戏", "第一人称射击游戏", "格斗游戏" }, Correct = new[] { 0 }, Explanation = "RPG是Role-Playing Game的缩写，即角色扮演游戏。" },
        new QuestionBankItem { Id = 5, Type = "single", Question = "《魂斗罗》经典版本中，30条命的秘籍是什么？", Options = new[] { "上上下下左右左右BA", "ABAB上下左右", "左右左右上下AB", "上下AB左右左右" }, Correct = new[] { 0 }, Explanation = "经典FC魂斗罗的30人秘籍是：上上下下左右左右BABA（或BA）。" },
        new QuestionBankItem { Id = 6, Type = "multiple", Question = "以下哪些属于射击类游戏？（多选）", Options = new[] { "CS:GO", "使命召唤", "怪物猎人", "Apex英雄" }, Correct = new[] { 0, 1, 3 }, Explanation = "怪物猎人是动作角色扮演游戏，CS:GO、使命召唤和Apex英雄都是射击类游戏。" },
        new QuestionBankItem { Id = 7, Type = "single", Question = "游戏中HP通常代表什么？", Options = new[] { "生命值", "魔法值", "攻击力", "防御力" }, Correct = new[] { 0 }, Explanation = "HP是Hit Points或Health Points的缩写，代表生命值。" },
        new QuestionBankItem { Id = 8, Type = "single", Question = "世界上第一款商业电子游戏是？", Options = new[] { "《乓》(Pong)", "《太空侵略者》", "《吃豆人》", "《俄罗斯方块》" }, Correct = new[] { 0 }, Explanation = "《乓》（Pong）由雅达利于1972年发布，被认为是第一款取得商业成功的电子游戏。" },
        new QuestionBankItem { Id = 9, Type = "single", Question = "《魔兽争霸3》中，哪个英雄被称为'剑圣'？", Options = new[] { "格罗姆·地狱咆哮", "萨穆罗", "泰瑞纳斯", "阿尔萨斯" }, Correct = new[] { 1 }, Explanation = "萨穆罗（Samuro）是《魔兽争霸3》中的剑圣英雄单位。" },
        new QuestionBankItem { Id = 10, Type = "multiple", Question = "以下哪些是RTS（即时战略）游戏？（多选）", Options = new[] { "星际争霸", "帝国时代", "英雄联盟", "红色警戒" }, Correct = new[] { 0, 1, 3 }, Explanation = "英雄联盟是MOBA类游戏，其余三个都是经典的RTS即时战略游戏。" },
        new QuestionBankItem { Id = 11, Type = "single", Question = "DPS在游戏术语中是什么意思？", Options = new[] { "每秒伤害", "最大生命值", "防御成功率", "移动速度" }, Correct = new[] { 0 }, Explanation = "DPS是Damage Per Second的缩写，表示每秒造成的伤害。" },
        new QuestionBankItem { Id = 12, Type = "single", Question = "以下哪个是任天堂出品的掌机？", Options = new[] { "Game Boy", "PlayStation Vita", "Xbox", "Sega Saturn" }, Correct = new[] { 0 }, Explanation = "Game Boy是任天堂1989年推出的经典掌机，其余由其他厂商出品。" },
        new QuestionBankItem { Id = 13, Type = "multiple", Question = "以下哪些是《英雄联盟》中的职业？（多选）", Options = new[] { "刺客", "射手", "祭司", "坦克" }, Correct = new[] { 0, 1, 3 }, Explanation = "祭司不是LOL的职业分类，LOL主要职业有战士、法师、刺客、坦克、射手、辅助。" },
        new QuestionBankItem { Id = 14, Type = "single", Question = "Buff在游戏中的含义是？", Options = new[] { "增益效果", "削弱效果", "掉线", "充值" }, Correct = new[] { 0 }, Explanation = "Buff指给角色添加的有益状态效果，反义词是Debuff（减益效果）。" },
        new QuestionBankItem { Id = 15, Type = "single", Question = "《最后生还者》的主角是？", Options = new[] { "乔尔和艾莉", "内森和艾莲娜", "杰洛特和希里", "亚瑟和约翰" }, Correct = new[] { 0 }, Explanation = "乔尔（Joel）和艾莉（Ellie）是《最后生还者》的双主角。" },
        new QuestionBankItem { Id = 16, Type = "single", Question = "MMORPG的中文全称？", Options = new[] { "大型多人在线角色扮演游戏", "多人在线竞技游戏", "单机角色扮演游戏", "多人在线射击游戏" }, Correct = new[] { 0 }, Explanation = "MMORPG是Massively Multiplayer Online Role-Playing Game的缩写。" },
        new QuestionBankItem { Id = 17, Type = "multiple", Question = "以下哪些是卡普空（Capcom）出品的游戏系列？（多选）", Options = new[] { "怪物猎人", "生化危机", "最终幻想", "鬼泣" }, Correct = new[] { 0, 1, 3 }, Explanation = "最终幻想是史克威尔艾尼克斯（Square Enix）的作品，其他三个都是卡普空的经典系列。" },
        new QuestionBankItem { Id = 18, Type = "single", Question = "FPS的中文全称是？", Options = new[] { "第一人称射击游戏", "第三人称射击游戏", "飞行模拟游戏", "策略游戏" }, Correct = new[] { 0 }, Explanation = "FPS是First-Person Shooter的缩写，即第一人称射击游戏。" },
        new QuestionBankItem { Id = 19, Type = "single", Question = "Steam游戏平台是哪家公司的产品？", Options = new[] { "Valve", "Epic Games", "暴雪", "EA" }, Correct = new[] { 0 }, Explanation = "Steam是Valve公司于2003年推出的数字游戏发行平台。" },
        new QuestionBankItem { Id = 20, Type = "multiple", Question = "以下哪些属于游戏主机？（多选）", Options = new[] { "PlayStation 5", "Xbox Series X", "Nintendo Switch", "RTX 4090" }, Correct = new[] { 0, 1, 2 }, Explanation = "RTX 4090是NVIDIA的显卡，不是游戏主机。其余三个都是主流游戏主机。" },
        new QuestionBankItem { Id = 21, Type = "single", Question = "AFK在游戏中表示什么？", Options = new[] { "离开键盘（暂离）", "攻击敌人", "组队", "复活" }, Correct = new[] { 0 }, Explanation = "AFK是Away From Keyboard的缩写，意思是玩家暂时离开游戏。" },
        new QuestionBankItem { Id = 22, Type = "single", Question = "《王者荣耀》是哪家公司开发的？", Options = new[] { "腾讯天美工作室", "网易游戏", "米哈游", "莉莉丝游戏" }, Correct = new[] { 0 }, Explanation = "《王者荣耀》是腾讯天美工作室开发的MOBA类手游。" },
        new QuestionBankItem { Id = 23, Type = "single", Question = "以下哪款游戏不属于Roguelike类型？", Options = new[] { "《杀戮尖塔》", "《以撒的结合》", "《星露谷物语》", "《黑帝斯》" }, Correct = new[] { 2 }, Explanation = "《星露谷物语》是模拟经营类游戏，其他三个都是Roguelike/Rogue-lite类游戏。" },
        new QuestionBankItem { Id = 24, Type = "multiple", Question = "以下哪些是《巫师3》中的角色？（多选）", Options = new[] { "杰洛特", "叶奈法", "艾瑞丝", "特莉丝" }, Correct = new[] { 0, 1, 3 }, Explanation = "艾瑞丝是《最终幻想7》的角色，杰洛特、叶奈法、特莉丝都是《巫师3》的主要角色。" },
        new QuestionBankItem { Id = 25, Type = "single", Question = "游戏中常说的'开荒'是什么意思？", Options = new[] { "首次挑战新副本/新内容", "耕种农作物", "删除存档重来", "出售装备" }, Correct = new[] { 0 }, Explanation = "开荒是游戏术语，指玩家第一次挑战新的副本、关卡或内容。" }
    };

    private static readonly Dictionary<string, QuizSession> _activeSessions = new();

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<QuizAttempt> _quizAttemptRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public QuizService(
        IPlayerRepository playerRepository,
        IRepository<QuizAttempt> quizAttemptRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _quizAttemptRepository = quizAttemptRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 开始每日答题（每日限一次）：从题库随机抽取 10 道题（单选/多选）创建答题会话
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>答题会话输出（会话 ID、10 道题目列表），玩家不存在或今日已答过返回 null</returns>
    public async Task<QuizSessionOutput?> StartQuizAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var today = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");
        var todayAttempted = await _context.QuizAttempts
            .AnyAsync(q => q.PlayerId == playerId && q.AttemptDate == today && !q.IsDeleted);

        if (todayAttempted)
        {
            return null;
        }

        var rnd = new Random();
        var shuffled = QuestionBank.OrderBy(_ => rnd.Next()).Take(10).ToList();

        var sessionId = Guid.NewGuid().ToString("N");
        var session = new QuizSession
        {
            PlayerId = playerId,
            SessionId = sessionId,
            Questions = shuffled,
            Answers = new Dictionary<int, List<int>>(),
            StartedAt = DateTimeOffset.UtcNow,
            CorrectCount = 0
        };

        _activeSessions[sessionId] = session;

        var draftAttempt = new QuizAttempt
        {
            PlayerId = playerId,
            AttemptDate = today,
            CorrectCount = 0,
            TotalCount = 10,
            GoldEarned = 0,
            CompletedAt = DateTimeOffset.UtcNow
        };
        await _quizAttemptRepository.AddAsync(draftAttempt);
        session.DraftAttemptId = draftAttempt.Id;

        return new QuizSessionOutput
        {
            SessionId = sessionId,
            Questions = shuffled.Select(q => new QuestionOutput
            {
                Id = q.Id,
                Type = q.Type,
                Question = q.Question,
                Options = q.Options.ToList(),
                CorrectCount = q.Correct.Length
            }).ToList(),
            CurrentIndex = 0,
            TotalQuestions = 10,
            TimeLimitSeconds = 180,
            StartedAt = session.StartedAt
        };
    }

    /// <summary>
    /// 提交单题答案：判断正误并更新答题会话状态、正确数、得分和累计答题时间
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">提交答案参数（会话 ID、题目索引、玩家选择选项）</param>
    /// <returns>答题结果输出（正确/错误、正确答案、得分、提示），会话不存在或索引越界返回 null</returns>
    public async Task<SubmitAnswerOutput?> SubmitAnswerAsync(string playerId, SubmitAnswerInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (!_activeSessions.TryGetValue(input.SessionId, out var session) || session.PlayerId != playerId)
        {
            return null;
        }

        if (input.QuestionIndex < 0 || input.QuestionIndex >= session.Questions.Count)
        {
            return null;
        }

        var question = session.Questions[input.QuestionIndex];
        var correctSet = new HashSet<int>(question.Correct);
        var selectedSet = new HashSet<int>(input.SelectedOptions ?? new List<int>());

        var correct = correctSet.SetEquals(selectedSet);

        session.Answers[input.QuestionIndex] = input.SelectedOptions ?? new List<int>();

        if (correct)
        {
            if (!session.AnsweredCorrectly.Contains(input.QuestionIndex))
            {
                session.CorrectCount++;
                session.AnsweredCorrectly.Add(input.QuestionIndex);
            }
        }
        else
        {
            session.AnsweredCorrectly.Remove(input.QuestionIndex);
            var realCorrect = session.Answers.Count(kvp =>
            {
                var idx = kvp.Key;
                var q = session.Questions[idx];
                return new HashSet<int>(q.Correct).SetEquals(new HashSet<int>(kvp.Value));
            });
            session.CorrectCount = realCorrect;
        }

        var answeredCount = session.Answers.Count;
        var currentScore = answeredCount > 0 ? (int)Math.Round((double)session.CorrectCount / session.Questions.Count * 100) : 0;

        return new SubmitAnswerOutput
        {
            Correct = correct,
            CorrectOptions = question.Correct.ToList(),
            Explanation = question.Explanation,
            CurrentScore = currentScore,
            CorrectCount = session.CorrectCount,
            AnsweredCount = answeredCount
        };
    }

    /// <summary>
    /// 结算答题会话：按正确率发放金币和经验奖励并记录答题历史
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="sessionId">答题会话 ID</param>
    /// <returns>结算结果输出（正确率、奖励金币/经验、总题数、正确数、答题时间），会话不存在返回 null</returns>
    public async Task<FinishQuizOutput?> FinishQuizAsync(string playerId, string sessionId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (!_activeSessions.TryGetValue(sessionId, out var session) || session.PlayerId != playerId)
        {
            return null;
        }

        var totalQuestions = session.Questions.Count;
        var correctCount = session.CorrectCount;
        var correctRate = totalQuestions > 0 ? (double)correctCount / totalQuestions : 0;

        long goldEarned = correctRate switch
        {
            >= 0.90 => 5000,
            >= 0.70 => 3000,
            >= 0.50 => 1500,
            >= 0.30 => 500,
            _ => 100
        };

        var message = correctRate switch
        {
            >= 0.90 => "太强了！你是行走的游戏百科！获得最高奖励！",
            >= 0.70 => "表现很不错！对游戏知识了解甚多！",
            >= 0.50 => "及格了！继续加油提升吧！",
            >= 0.30 => "还有进步空间，多玩玩游戏补补课吧~",
            _ => "呃...看来你需要恶补游戏知识了，再接再厉！"
        };

        player.Gold += goldEarned;

        var today = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");
        QuizAttempt? attempt = null;
        if (!string.IsNullOrEmpty(session.DraftAttemptId))
        {
            attempt = await _quizAttemptRepository.GetByIdAsync(session.DraftAttemptId);
        }

        if (attempt == null)
        {
            attempt = await _context.QuizAttempts
                .FirstOrDefaultAsync(q => q.PlayerId == playerId && q.AttemptDate == today && !q.IsDeleted);
        }

        if (attempt != null)
        {
            attempt.CorrectCount = correctCount;
            attempt.TotalCount = totalQuestions;
            attempt.GoldEarned = goldEarned;
            attempt.CompletedAt = DateTimeOffset.UtcNow;
            await _quizAttemptRepository.UpdateAsync(attempt);
        }
        else
        {
            await _quizAttemptRepository.AddAsync(new QuizAttempt
            {
                PlayerId = playerId,
                AttemptDate = today,
                CorrectCount = correctCount,
                TotalCount = totalQuestions,
                GoldEarned = goldEarned,
                CompletedAt = DateTimeOffset.UtcNow
            });
        }

        await _playerRepository.UpdateAsync(player);
        await _context.SaveChangesAsync();

        _activeSessions.Remove(sessionId);

        return new FinishQuizOutput
        {
            SessionId = sessionId,
            CorrectRate = correctRate,
            GoldEarned = goldEarned,
            Message = message,
            TotalQuestions = totalQuestions,
            CorrectCount = correctCount
        };
    }

    /// <summary>
    /// 获取玩家答题历史记录（含答题次数、平均正确率、累计获得金币等统计与最近 20 次明细）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>答题历史输出，玩家不存在返回 null</returns>
    public async Task<QuizHistoryOutput?> GetHistoryAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var attempts = await _context.QuizAttempts
            .Where(q => q.PlayerId == playerId && !q.IsDeleted)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        var today = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd");
        var todayAttempt = attempts.FirstOrDefault(q => q.AttemptDate == today);

        return new QuizHistoryOutput
        {
            TodayAttempted = todayAttempt != null,
            TodayCorrectRate = todayAttempt != null && todayAttempt.TotalCount > 0
                ? (double)todayAttempt.CorrectCount / todayAttempt.TotalCount
                : null,
            TodayGoldEarned = todayAttempt?.GoldEarned ?? 0,
            History = attempts.Select(a => new QuizHistoryOutput.QuizHistoryItem
            {
                AttemptDate = a.AttemptDate,
                CorrectCount = a.CorrectCount,
                TotalCount = a.TotalCount,
                GoldEarned = a.GoldEarned,
                CompletedAt = a.CompletedAt
            }).ToList()
        };
    }

    private class QuestionBankItem
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string[] Options { get; set; } = Array.Empty<string>();
        public int[] Correct { get; set; } = Array.Empty<int>();
        public string Explanation { get; set; } = string.Empty;
    }

    private class QuizSession
    {
        public string PlayerId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public List<QuestionBankItem> Questions { get; set; } = new();
        public Dictionary<int, List<int>> Answers { get; set; } = new();
        public DateTimeOffset StartedAt { get; set; }
        public int CorrectCount { get; set; }
        public HashSet<int> AnsweredCorrectly { get; set; } = new();
        public string? DraftAttemptId { get; set; }
    }
}
