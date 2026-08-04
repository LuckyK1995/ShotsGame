namespace ShotsGame.Core.DTOs.Quiz;

/// <summary>
/// 题目出参
/// </summary>
public class QuestionOutput
{
    /// <summary>
    /// 题目唯一ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 题目类型（单选/多选等）
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 题目正文内容
    /// </summary>
    public string Question { get; set; } = string.Empty;

    /// <summary>
    /// 选项列表
    /// </summary>
    public List<string> Options { get; set; } = new();

    /// <summary>
    /// 正确选项数量（用于多选题）
    /// </summary>
    public int CorrectCount { get; set; }
}

/// <summary>
/// 答题会话出参
/// </summary>
public class QuizSessionOutput
{
    /// <summary>
    /// 答题会话唯一标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 本次答题的题目列表
    /// </summary>
    public List<QuestionOutput> Questions { get; set; } = new();

    /// <summary>
    /// 当前作答的题目索引（从0开始）
    /// </summary>
    public int CurrentIndex { get; set; }

    /// <summary>
    /// 本次答题的题目总数
    /// </summary>
    public int TotalQuestions { get; set; }

    /// <summary>
    /// 答题时间限制（秒）
    /// </summary>
    public int TimeLimitSeconds { get; set; } = 180;

    /// <summary>
    /// 答题开始时间
    /// </summary>
    public DateTimeOffset StartedAt { get; set; }
}

/// <summary>
/// 提交答案入参
/// </summary>
public class SubmitAnswerInput
{
    /// <summary>
    /// 答题会话唯一标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 作答的题目索引（从0开始）
    /// </summary>
    public int QuestionIndex { get; set; }

    /// <summary>
    /// 玩家选中的选项索引列表
    /// </summary>
    public List<int> SelectedOptions { get; set; } = new();
}

/// <summary>
/// 单题结果出参
/// </summary>
public class SubmitAnswerOutput
{
    /// <summary>
    /// 作答是否正确
    /// </summary>
    public bool Correct { get; set; }

    /// <summary>
    /// 正确选项索引列表
    /// </summary>
    public List<int> CorrectOptions { get; set; } = new();

    /// <summary>
    /// 题目解析说明
    /// </summary>
    public string Explanation { get; set; } = string.Empty;

    /// <summary>
    /// 当前累计得分
    /// </summary>
    public int CurrentScore { get; set; }

    /// <summary>
    /// 已答对题目数量
    /// </summary>
    public int CorrectCount { get; set; }

    /// <summary>
    /// 已作答题目数量
    /// </summary>
    public int AnsweredCount { get; set; }
}

/// <summary>
/// 结算出参
/// </summary>
public class FinishQuizOutput
{
    /// <summary>
    /// 答题会话唯一标识
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// 正确率（0~1）
    /// </summary>
    public double CorrectRate { get; set; }

    /// <summary>
    /// 获得金币数量
    /// </summary>
    public long GoldEarned { get; set; }

    /// <summary>
    /// 结算提示信息
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 本次答题题目总数
    /// </summary>
    public int TotalQuestions { get; set; }

    /// <summary>
    /// 答对题目数量
    /// </summary>
    public int CorrectCount { get; set; }
}

/// <summary>
/// 历史记录出参
/// </summary>
public class QuizHistoryOutput
{
    /// <summary>
    /// 今日是否已作答过
    /// </summary>
    public bool TodayAttempted { get; set; }

    /// <summary>
    /// 今日答题正确率
    /// </summary>
    public double? TodayCorrectRate { get; set; }

    /// <summary>
    /// 今日答题获得的金币
    /// </summary>
    public long TodayGoldEarned { get; set; }

    /// <summary>
    /// 历史答题记录列表
    /// </summary>
    public List<QuizHistoryItem> History { get; set; } = new();

    /// <summary>
    /// 答题历史条目
    /// </summary>
    public class QuizHistoryItem
    {
        /// <summary>
        /// 答题日期字符串
        /// </summary>
        public string AttemptDate { get; set; } = string.Empty;

        /// <summary>
        /// 答对题目数量
        /// </summary>
        public int CorrectCount { get; set; }

        /// <summary>
        /// 题目总数
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// 获得金币数量
        /// </summary>
        public long GoldEarned { get; set; }

        /// <summary>
        /// 答题完成时间
        /// </summary>
        public DateTimeOffset CompletedAt { get; set; }
    }
}
