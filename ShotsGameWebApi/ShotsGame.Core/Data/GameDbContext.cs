using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ShotsGame.Core.Entities;

namespace ShotsGame.Core.Data;

public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options)
    {
    }

    public DbSet<Player> Players => Set<Player>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<ItemStack> Inventory => Set<ItemStack>();
    public DbSet<BattleRecord> BattleRecords => Set<BattleRecord>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<Mail> Mails => Set<Mail>();
    public DbSet<PlayerSkill> PlayerSkills => Set<PlayerSkill>();
    public DbSet<Entities.Talent> Talents => Set<Entities.Talent>();
    public DbSet<CodexEntry> CodexEntries => Set<CodexEntry>();
    public DbSet<CheckInRecord> CheckInRecords => Set<CheckInRecord>();
    public DbSet<OnlineRewardRecord> OnlineRewardRecords => Set<OnlineRewardRecord>();
    public DbSet<LotteryRecord> LotteryRecords => Set<LotteryRecord>();
    public DbSet<HorseRaceSession> HorseRaceSessions => Set<HorseRaceSession>();
    public DbSet<SaveDataSnapshot> SaveDataSnapshots => Set<SaveDataSnapshot>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<LotteryPotRecord> LotteryPotRecords => Set<LotteryPotRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureBaseEntity(modelBuilder);
        ConfigurePlayer(modelBuilder);
        ConfigureEquipment(modelBuilder);
        ConfigureItemStack(modelBuilder);
        ConfigureBattleRecord(modelBuilder);
        ConfigureAchievement(modelBuilder);
        ConfigureMail(modelBuilder);
        ConfigurePlayerSkill(modelBuilder);
        ConfigureTalent(modelBuilder);
        ConfigureCodexEntry(modelBuilder);
        ConfigureCheckInRecord(modelBuilder);
        ConfigureOnlineRewardRecord(modelBuilder);
        ConfigureLotteryRecord(modelBuilder);
        ConfigureHorseRaceSession(modelBuilder);
        ConfigureSaveDataSnapshot(modelBuilder);
        ConfigureQuizAttempt(modelBuilder);
        ConfigureLotteryPotRecord(modelBuilder);
        ConfigureGlobalQueryFilters(modelBuilder);
    }

    private static void ConfigureBaseEntity(ModelBuilder modelBuilder)
    {
        var entityTypes = modelBuilder.Model.GetEntityTypes()
            .Where(e => e.BaseType == null && typeof(BaseEntity).IsAssignableFrom(e.ClrType));

        foreach (var entityType in entityTypes)
        {
            entityType.SetTableName(entityType.ClrType.Name + "s");

            entityType.GetProperty("Id")!.SetColumnName("Id");
            entityType.GetProperty("CreatorId")!.SetColumnName("CreatorId");
            entityType.GetProperty("CreatedAt")!.SetColumnName("CreatedAt");
            entityType.GetProperty("ModifierId")!.SetColumnName("ModifierId");
            entityType.GetProperty("ModifiedAt")!.SetColumnName("ModifiedAt");
            entityType.GetProperty("DeleterId")!.SetColumnName("DeleterId");
            entityType.GetProperty("DeletedAt")!.SetColumnName("DeletedAt");
            entityType.GetProperty("IsDeleted")!.SetColumnName("IsDeleted");
        }

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            var dateTimeOffsetProperties = clrType.GetProperties()
                .Where(p => p.PropertyType == typeof(DateTimeOffset) || p.PropertyType == typeof(DateTimeOffset?));

            foreach (var prop in dateTimeOffsetProperties)
            {
                var property = entityType.FindProperty(prop.Name);
                if (property != null)
                {
                    property.SetValueConverter(new DateTimeOffsetToStringConverter());
                }
            }
        }
    }

    private static void ConfigurePlayer(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email);
        });
    }

    private static void ConfigureEquipment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.Slot });

            entity.HasOne(e => e.Player)
                .WithMany(p => p.Equipments)
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureItemStack(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ItemStack>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.ItemId }).IsUnique();

            entity.HasOne(e => e.Player)
                .WithMany(p => p.Inventory)
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureBattleRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BattleRecord>(entity =>
        {
            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => e.Score);

            entity.HasOne(e => e.Player)
                .WithMany(p => p.BattleRecords)
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureAchievement(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Achievement>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.AchievementId }).IsUnique();

            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureMail(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Mail>(entity =>
        {
            entity.HasIndex(e => e.PlayerId);

            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigurePlayerSkill(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PlayerSkill>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.SkillId }).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureTalent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Entities.Talent>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.TalentId }).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCodexEntry(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CodexEntry>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.EntryId, e.Type }).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCheckInRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CheckInRecord>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.WeekKey }).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureOnlineRewardRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OnlineRewardRecord>(entity =>
        {
            entity.HasIndex(e => e.PlayerId).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureLotteryRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LotteryRecord>(entity =>
        {
            entity.HasIndex(e => e.PlayerId).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureHorseRaceSession(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HorseRaceSession>(entity =>
        {
            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => e.SessionId).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSaveDataSnapshot(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SaveDataSnapshot>(entity =>
        {
            entity.HasIndex(e => e.PlayerId).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureQuizAttempt(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<QuizAttempt>(entity =>
        {
            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => new { e.PlayerId, e.AttemptDate });
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureLotteryPotRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LotteryPotRecord>(entity =>
        {
            entity.HasIndex(e => e.PlayerId).IsUnique();
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureGlobalQueryFilters(ModelBuilder modelBuilder)
    {
        var entityTypes = modelBuilder.Model.GetEntityTypes()
            .Where(e => e.BaseType == null && typeof(BaseEntity).IsAssignableFrom(e.ClrType));

        foreach (var entityType in entityTypes)
        {
            var isDeletedProperty = entityType.ClrType.GetProperty("IsDeleted")!;
            var param = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
            var filter = System.Linq.Expressions.Expression.Lambda(
                System.Linq.Expressions.Expression.Equal(
                    System.Linq.Expressions.Expression.Property(param, isDeletedProperty),
                    System.Linq.Expressions.Expression.Constant(false)),
                param);
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }
}
