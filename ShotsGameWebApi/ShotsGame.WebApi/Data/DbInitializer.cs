using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.Entities;
using ShotsGame.WebApi.Services;

namespace ShotsGame.WebApi.Data;

/// <summary>数据库初始化器：创建种子数据</summary>
public static class DbInitializer
{
    /// <summary>初始化数据库种子数据（仅在首次创建时写入）</summary>
    public static async Task InitializeAsync(GameDbContext context, PasswordService passwordService)
    {
        await context.Database.EnsureCreatedAsync();

        // 已有玩家则跳过种子
        if (await context.Players.AnyAsync())
        {
            return;
        }

        // ─── 默认测试玩家 ───
        var testPlayer = new Player
        {
            Username = "test",
            DisplayName = "末日突围者",
            Email = "test@shotsgame.local",
            PasswordHash = passwordService.HashPassword("123456"),
            Level = 1,
            Gold = 1000,
            Score = 0
        };

        await context.Players.AddAsync(testPlayer);
        await context.SaveChangesAsync();
    }
}
