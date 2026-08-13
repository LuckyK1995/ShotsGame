using AutoMapper;
using ShotsGame.Core.DTOs.Achievement;
using ShotsGame.Core.DTOs.Auth;
using ShotsGame.Core.DTOs.Battle;
using ShotsGame.Core.DTOs.Chat;
using ShotsGame.Core.DTOs.CheckIn;
using ShotsGame.Core.DTOs.Codex;
using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Inventory;
using ShotsGame.Core.DTOs.Mail;
using ShotsGame.Core.DTOs.OnlineReward;
using ShotsGame.Core.DTOs.Player;
using ShotsGame.Core.DTOs.Pk;
using ShotsGame.Core.DTOs.Talent;
using ShotsGame.Core.Entities;

namespace ShotsGame.Core.Mappings;

public class PlayerProfile : Profile
{
    public PlayerProfile()
    {
        DisableConstructorMapping();

        // ─── Player / Auth / Battle ───
        CreateMap<Player, PlayerProfileOutput>();

        CreateMap<Player, LeaderboardEntryOutput>()
            .ForMember(dest => dest.Rank, opt => opt.Ignore())
            .ForMember(dest => dest.PlayerId, opt => opt.MapFrom(src => src.Id))
            // 计算字段由 Service 补充
            .ForMember(dest => dest.PkWinRate, opt => opt.Ignore())
            .ForMember(dest => dest.IsOnline, opt => opt.Ignore());

        CreateMap<RegisterInput, Player>()
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email));

        CreateMap<BattleRecord, BattleRecordOutput>();

        // ─── Equipment ───
        CreateMap<Equipment, EquipmentOutput>()
            .ForMember(dest => dest.EnchantmentJson, opt => opt.Ignore()); // 由Service拼装

        // ─── Inventory / ItemStack ───
        CreateMap<ItemStack, ItemStackOutput>()
            .ForMember(dest => dest.Name, opt => opt.Ignore())
            .ForMember(dest => dest.Icon, opt => opt.Ignore())
            .ForMember(dest => dest.Description, opt => opt.Ignore())
            .ForMember(dest => dest.Rarity, opt => opt.Ignore())
            .ForMember(dest => dest.Type, opt => opt.Ignore());

        // ─── Mail ───
        CreateMap<Mail, MailOutput>()
            .ForMember(dest => dest.HasAttachments,
                opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.AttachmentsJson)));

        // ─── Achievement ───
        CreateMap<Achievement, AchievementOutput>()
            .ForMember(dest => dest.Name, opt => opt.Ignore())
            .ForMember(dest => dest.Description, opt => opt.Ignore())
            .ForMember(dest => dest.Icon, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.Ignore())
            .ForMember(dest => dest.Target, opt => opt.Ignore())
            .ForMember(dest => dest.RewardType, opt => opt.Ignore())
            .ForMember(dest => dest.RewardValue, opt => opt.Ignore()); // 由配置表补充

        // ─── Talent ───
        CreateMap<Core.Entities.Talent, TalentOutput>();

        // ─── Codex ───
        CreateMap<CodexEntry, CodexEntryOutput>()
            .ForMember(dest => dest.Name, opt => opt.Ignore())
            .ForMember(dest => dest.Description, opt => opt.Ignore())
            .ForMember(dest => dest.Icon, opt => opt.Ignore()); // 由配置表补充

        // ─── CheckIn / OnlineReward 不依赖实体→DTO直接映射，由Service构造 ───

        // ─── 聊天：ChatMessage -> ChatMessageOutput ───
        CreateMap<ChatMessage, ChatMessageOutput>();

        // ─── PK：PkRecord -> PkRecordOutput（玩家昵称由 Service join 后填入） ───
        CreateMap<PkRecord, PkRecordOutput>()
            .ForMember(dest => dest.ChallengerName, opt => opt.Ignore())
            .ForMember(dest => dest.DefenderName, opt => opt.Ignore());

        // 注意：Player -> OnlinePlayerOutput 因含计算字段（PkWinRate、IsOnline 等），
        // 由 PkService 手动构造，不在此处自动映射
    }
}
