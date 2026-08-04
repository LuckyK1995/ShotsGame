using ShotsGame.Core.DTOs.Quiz;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 答题服务接口，负责答题会话创建、答案提交、结算与历史记录查询等业务
/// </summary>
public interface IQuizService
{
    /// <summary>
    /// 创建并开始一场新的答题会话，生成题目列表
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>新答题会话信息与首轮题目，若失败则返回 null</returns>
    Task<QuizSessionOutput?> StartQuizAsync(string playerId);

    /// <summary>
    /// 提交当前题目的答案并判定正误
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">提交答案请求参数（包含会话 ID、题目 ID、选择项）</param>
    /// <returns>答案判定结果与下一题信息，若失败则返回 null</returns>
    Task<SubmitAnswerOutput?> SubmitAnswerAsync(string playerId, SubmitAnswerInput input);

    /// <summary>
    /// 结算答题会话，计算得分并发放奖励
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="sessionId">答题会话唯一标识</param>
    /// <returns>答题结算结果（得分、正确率、奖励），若失败则返回 null</returns>
    Task<FinishQuizOutput?> FinishQuizAsync(string playerId, string sessionId);

    /// <summary>
    /// 获取玩家历史答题记录与统计
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>答题历史记录与统计数据，若失败则返回 null</returns>
    Task<QuizHistoryOutput?> GetHistoryAsync(string playerId);
}
