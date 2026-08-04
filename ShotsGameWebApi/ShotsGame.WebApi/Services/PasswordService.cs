namespace ShotsGame.WebApi.Services;

/// <summary>
/// 密码哈希服务：使用 BCrypt 算法进行密码加密和校验
/// </summary>
public class PasswordService
{
    private const int WorkFactor = 12;

    /// <summary>
    /// 对明文密码进行 BCrypt 哈希加密
    /// </summary>
    /// <param name="password">明文密码</param>
    /// <returns>BCrypt 哈希后的密码字符串</returns>
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    /// <summary>
    /// 校验明文密码与存储的哈希是否匹配
    /// </summary>
    /// <param name="password">用户输入的明文密码</param>
    /// <param name="hash">数据库中存储的 BCrypt 哈希值</param>
    /// <returns>匹配返回 true，否则返回 false</returns>
    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
