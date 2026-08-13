using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShotsGame.Core.DTOs.Quiz;
using ShotsGame.Core.Models;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Controllers;

/// <summary>
/// 答题控制器：负责每日答题开始、逐题提交答案、答题结算与历史记录查询
/// </summary>
[ApiController]
[Route("api/quiz")]
[Authorize]
public class QuizController : AppControllerBase
{
    private readonly IQuizService _quizService;

    public QuizController(IQuizService quizService)
    {
        _quizService = quizService;
    }

    /// <summary>
    /// 开始今日每日答题，获取答题会话与题目列表
    /// </summary>
    /// <returns>答题会话 QuizSessionOutput（含会话 ID、题目列表）</returns>
    [HttpPost("start")]
    public async Task<IActionResult> StartQuizAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<QuizSessionOutput>();
        }

        var result = await _quizService.StartQuizAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<QuizSessionOutput>("玩家不存在或今日已答题");
        }

        return Success(result, "开始答题");
    }

    /// <summary>
    /// 提交当前题目的玩家答案，判断对错并进入下一题
    /// </summary>
    /// <param name="input">答案参数，包含会话 ID、题目索引和玩家选项</param>
    /// <returns>本题结果 SubmitAnswerOutput（含是否正确、正确答案、累计得分）</returns>
    [HttpPost("submit-answer")]
    public async Task<IActionResult> SubmitAnswerAsync([FromBody] SubmitAnswerInput input)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<SubmitAnswerOutput>();
        }

        if (string.IsNullOrEmpty(input.SessionId) || input.QuestionIndex < 0)
        {
            return InvalidParamFail<SubmitAnswerOutput>("提交答案参数错误");
        }

        var result = await _quizService.SubmitAnswerAsync(playerId, input);
        if (result == null)
        {
            return NotFoundFail<SubmitAnswerOutput>("答题会话不存在");
        }

        return Success(result, "提交成功");
    }

    /// <summary>
    /// 结束答题会话，结算总体得分并发放奖励
    /// </summary>
    /// <param name="sessionId">答题会话唯一标识 ID</param>
    /// <returns>结算结果 FinishQuizOutput（含总分、正确率、获得奖励）</returns>
    [HttpPost("finish/{sessionId}")]
    public async Task<IActionResult> FinishQuizAsync(string sessionId)
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<FinishQuizOutput>();
        }

        if (string.IsNullOrEmpty(sessionId))
        {
            return InvalidParamFail<FinishQuizOutput>("会话ID不能为空");
        }

        var result = await _quizService.FinishQuizAsync(playerId, sessionId);
        if (result == null)
        {
            return NotFoundFail<FinishQuizOutput>("答题会话不存在");
        }

        return Success(result, "结算成功");
    }

    /// <summary>
    /// 获取当前玩家历次答题的历史记录
    /// </summary>
    /// <returns>答题历史列表 QuizHistoryOutput（含各次答题日期、得分、正确率）</returns>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistoryAsync()
    {
        var playerId = GetCurrentUserId();
        if (string.IsNullOrEmpty(playerId))
        {
            return UnauthorizedFail<QuizHistoryOutput>();
        }

        var result = await _quizService.GetHistoryAsync(playerId);
        if (result == null)
        {
            return NotFoundFail<QuizHistoryOutput>("玩家不存在");
        }

        return Success(result, "获取成功");
    }
}
