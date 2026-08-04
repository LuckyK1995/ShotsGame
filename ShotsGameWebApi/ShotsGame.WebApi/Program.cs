using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShotsGame.Core.Data;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Data;
using ShotsGame.WebApi.Middlewares;
using ShotsGame.WebApi.Services;
using ShotsGame.WebApi.Services.Interfaces;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

// ===== 数据库配置 =====
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=shotsgame.db";

builder.Services.AddDbContext<GameDbContext>(options =>
    options.UseSqlite(connectionString));

// ===== 仓储注册 =====
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();

// ===== 服务注册 =====
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton<JwtService>();

// ===== 业务服务注册 =====
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IBattleService, BattleService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<ISkillService, SkillService>();
builder.Services.AddScoped<ITalentService, TalentService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IShopService, ShopService>();
builder.Services.AddScoped<IMailService, MailService>();
builder.Services.AddScoped<ICheckInService, CheckInService>();
builder.Services.AddScoped<IAchievementService, AchievementService>();
builder.Services.AddScoped<ICodexService, CodexService>();
builder.Services.AddScoped<ILotteryService, LotteryService>();
builder.Services.AddScoped<IHorseRacingService, HorseRacingService>();
builder.Services.AddScoped<ILotteryPotService, LotteryPotService>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<ISaveDataService, SaveDataService>();
builder.Services.AddScoped<IOnlineRewardService, OnlineRewardService>();
builder.Services.AddScoped<IGameModeService, GameModeService>();
builder.Services.AddScoped<ICalculateService, CalculateService>();
builder.Services.AddScoped<IEnhanceService, EnhanceService>();

// ===== AutoMapper 配置 =====
builder.Services.AddAutoMapper(typeof(ShotsGame.Core.Mappings.PlayerProfile).Assembly);

// ===== 控制器与 JSON 配置 =====
builder.Services.AddControllers()
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.Converters.Add(new DateTimeOffsetJsonConverter());
    options.JsonSerializerOptions.Converters.Add(new NullableDateTimeOffsetJsonConverter());
});

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressInferBindingSourcesForParameters = true;
});

// OpenAPI / Swagger（中文文档 + XML 注释注入，带 XML 解析容错）
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // ===== 参数命名策略 / 枚举 inline 展示 =====
    options.DescribeAllParametersInCamelCase();
    options.UseInlineDefinitionsForEnums();

    // ===== 注入 XML 注释文件（Core + WebApi，显式做 XML 容错避免 swagger.json 500） =====
    static void SafeIncludeXml(SwaggerGenOptions opt, string xmlPath)
    {
        if (!File.Exists(xmlPath)) return;
        try
        {
            // 先用 XmlDocument 加载一遍，验证 XML 合法；非法则跳过，防止 Swagger 在生成时崩溃
            var doc = new XmlDocument();
            doc.Load(xmlPath);
            opt.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
        }
        catch (XmlException)
        {
            // 注释中存在非法 XML 片段（例如未转义的尖括号/孤立标签），忽略该文件防止 swagger.json 崩溃
        }
    }

    var baseDir = AppContext.BaseDirectory;
    SafeIncludeXml(options, Path.Combine(baseDir, "ShotsGame.Core.xml"));
    SafeIncludeXml(options, Path.Combine(baseDir, "ShotsGame.WebApi.xml"));
});

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// JWT 认证
var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey 未配置");
var issuer = jwtSection["Issuer"] ?? "ShotsGame";
var audience = jwtSection["Audience"] ?? "ShotsGame.Client";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// ===== 自动数据库迁移与种子 =====
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<GameDbContext>();
    await dbContext.Database.EnsureCreatedAsync();

    var passwordService = scope.ServiceProvider.GetRequiredService<PasswordService>();
    await DbInitializer.InitializeAsync(dbContext, passwordService);
}

// ===== 中间件管线 =====
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "ShotsGame 游戏后端 API v1");
        options.DocumentTitle = "ShotsGame 游戏后端 API 文档";
        options.DefaultModelsExpandDepth(2);
        options.DisplayOperationId();
        options.DisplayRequestDuration();
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public class DateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset>
{
    private const string Format = "yyyy-MM-dd HH:mm:ss";

    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value)) return default;
        if (DateTimeOffset.TryParse(value, out var result)) return result;
        return DateTimeOffset.ParseExact(value, Format, System.Globalization.CultureInfo.InvariantCulture);
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(Format, System.Globalization.CultureInfo.InvariantCulture));
    }
}

public class NullableDateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset?>
{
    private const string Format = "yyyy-MM-dd HH:mm:ss";

    public override DateTimeOffset? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value)) return null;
        if (DateTimeOffset.TryParse(value, out var result)) return result;
        return DateTimeOffset.ParseExact(value, Format, System.Globalization.CultureInfo.InvariantCulture);
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteStringValue(value.Value.ToString(Format, System.Globalization.CultureInfo.InvariantCulture));
        else
            writer.WriteNullValue();
    }
}
