using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Codex;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 图鉴系统服务：敌人/装备/物品图鉴总览查询、新发现图鉴条目解锁与更新
/// </summary>
public class CodexService : ICodexService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<CodexEntry> _codexRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public CodexService(
        IPlayerRepository playerRepository,
        IRepository<CodexEntry> codexRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _codexRepository = codexRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>敌人图鉴配置（8种）</summary>
    private static readonly List<(string Id, string Name, string Desc)> EnemyConfigs = new()
    {
        ("enemy_slime", "史莱姆", "最基础的小怪，凝胶状生物，行动缓慢但数量众多"),
        ("enemy_goblin", "哥布林", "狡猾的小型人形生物，喜欢成群结队袭击旅行者"),
        ("enemy_skeleton", "骷髅兵", "被黑暗魔法复活的亡者，手持锈迹斑斑的弯刀"),
        ("enemy_orc", "兽人战士", "强壮的半兽人部落战士，以战斗和掠夺为生"),
        ("enemy_dark_mage", "黑暗法师", "精通禁忌魔法的邪恶施法者，擅长远程法术攻击"),
        ("enemy_demon", "恶魔", "来自深渊的邪恶生物，拥有强大的力量和腐蚀性气息"),
        ("enemy_vampire", "吸血鬼", "永生的暗夜贵族，吸食鲜血并能化身为蝙蝠"),
        ("enemy_dragon", "远古巨龙", "传说中的顶级掠食者，吐息可焚毁一切")
    };

    /// <summary>装备图鉴配置（6品质）</summary>
    private static readonly List<(string Id, string Name, string Desc)> EquipmentConfigs = new()
    {
        ("equip_common", "普通品质装备", "随处可见的普通装备，基础属性平平无奇"),
        ("equip_advanced", "进阶品质装备", "经过工匠精心打造，拥有更好的基础属性"),
        ("equip_fine", "精良品质装备", "注入魔力的装备，附带额外属性加成"),
        ("equip_legendary", "传说品质装备", "流传于古老传说中的神器，拥有强大的特殊效果"),
        ("equip_epic", "史诗品质装备", "承载着英雄意志的装备，能激发使用者的潜能"),
        ("equip_mythic", "神话品质装备", "来自神话时代的至宝，蕴含着毁天灭地的力量")
    };

    /// <summary>物品图鉴配置（7种）</summary>
    private static readonly List<(string Id, string Name, string Desc)> ItemConfigs = new()
    {
        ("item_potion_hp", "生命药水", "恢复生命值的红色药剂，冒险者的常备物资"),
        ("item_potion_mp", "魔力药水", "恢复魔力的蓝色药剂，法师们的挚爱"),
        ("item_gem_silver", "银矿原石", "开采自山脉的银矿石，可用于锻造或售卖"),
        ("item_gem_gold", "金矿石", "珍贵的金矿石，价值连城的硬通货"),
        ("item_scroll_teleport", "传送卷轴", "铭刻着空间魔法的古老卷轴，可瞬间返回城镇"),
        ("item_food_bread", "旅行面包", "耐储存的干粮，长途旅行的必备食物"),
        ("item_key_dungeon", "地下城钥匙", "打开隐藏地下城大门的神秘钥匙")
    };

    /// <summary>
    /// 获取玩家图鉴总览（敌人、装备、物品三大分类），返回总条目数、已解锁数及各分类明细
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>图鉴总览输出，玩家不存在返回 null</returns>
    public async Task<CodexOutput?> GetCodexAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var entries = await _context.CodexEntries
            .Where(e => e.PlayerId == playerId && !e.IsDeleted)
            .ToDictionaryAsync(e => (e.EntryId, e.Type));

        var output = new CodexOutput();

        foreach (var cfg in EnemyConfigs)
        {
            entries.TryGetValue((cfg.Id, CodexEntryType.Enemy), out var pe);
            var entry = new CodexEntryOutput
            {
                EntryId = cfg.Id,
                Type = CodexEntryType.Enemy,
                Name = cfg.Name,
                Description = cfg.Desc,
                Discovered = pe?.Discovered ?? false,
                Kills = pe?.Kills,
                Obtained = null
            };
            output.EnemyEntries.Add(entry);
            if (entry.Discovered) output.EnemyDiscovered++;
        }
        output.EnemyTotal = EnemyConfigs.Count;

        foreach (var cfg in EquipmentConfigs)
        {
            entries.TryGetValue((cfg.Id, CodexEntryType.Equipment), out var pe);
            var entry = new CodexEntryOutput
            {
                EntryId = cfg.Id,
                Type = CodexEntryType.Equipment,
                Name = cfg.Name,
                Description = cfg.Desc,
                Discovered = pe?.Discovered ?? false,
                Kills = null,
                Obtained = pe?.Obtained
            };
            output.EquipmentEntries.Add(entry);
            if (entry.Discovered) output.EquipmentDiscovered++;
        }
        output.EquipmentTotal = EquipmentConfigs.Count;

        foreach (var cfg in ItemConfigs)
        {
            entries.TryGetValue((cfg.Id, CodexEntryType.Item), out var pe);
            var entry = new CodexEntryOutput
            {
                EntryId = cfg.Id,
                Type = CodexEntryType.Item,
                Name = cfg.Name,
                Description = cfg.Desc,
                Discovered = pe?.Discovered ?? false,
                Kills = null,
                Obtained = pe?.Obtained
            };
            output.ItemEntries.Add(entry);
            if (entry.Discovered) output.ItemDiscovered++;
        }
        output.ItemTotal = ItemConfigs.Count;

        return output;
    }

    /// <summary>
    /// 更新图鉴条目：解锁或更新玩家的图鉴条目（首次发现自动记录，多次发现更新发现次数）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">更新参数（条目类型、条目 ID、名称、描述、图标）</param>
    /// <returns>图鉴条目输出，玩家不存在返回 null</returns>
    public async Task<CodexEntryOutput?> UpdateEntryAsync(string playerId, UpdateCodexInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var entry = await _context.CodexEntries
            .FirstOrDefaultAsync(e => e.PlayerId == playerId
                && e.EntryId == input.EntryId
                && e.Type == input.Type
                && !e.IsDeleted);

        string entryName = string.Empty;
        string entryDesc = string.Empty;

        switch (input.Type)
        {
            case CodexEntryType.Enemy:
                var ec = EnemyConfigs.FirstOrDefault(c => c.Id == input.EntryId);
                entryName = ec.Name;
                entryDesc = ec.Desc;
                break;
            case CodexEntryType.Equipment:
                var eq = EquipmentConfigs.FirstOrDefault(c => c.Id == input.EntryId);
                entryName = eq.Name;
                entryDesc = eq.Desc;
                break;
            case CodexEntryType.Item:
                var ic = ItemConfigs.FirstOrDefault(c => c.Id == input.EntryId);
                entryName = ic.Name;
                entryDesc = ic.Desc;
                break;
        }

        if (entry == null)
        {
            entry = new CodexEntry
            {
                PlayerId = playerId,
                EntryId = input.EntryId,
                Type = input.Type,
                Name = entryName,
                Description = entryDesc,
                Discovered = input.MarkDiscovered,
                Kills = input.IncrementKills > 0 ? input.IncrementKills : null,
                Obtained = input.IncrementObtained > 0 ? input.IncrementObtained : null
            };
            await _codexRepository.AddAsync(entry);
        }
        else
        {
            if (input.IncrementKills.HasValue && input.IncrementKills.Value > 0)
            {
                entry.Kills = (entry.Kills ?? 0) + input.IncrementKills.Value;
            }
            if (input.IncrementObtained.HasValue && input.IncrementObtained.Value > 0)
            {
                entry.Obtained = (entry.Obtained ?? 0) + input.IncrementObtained.Value;
            }
            if (input.MarkDiscovered && !entry.Discovered)
            {
                entry.Discovered = true;
            }
            if (string.IsNullOrWhiteSpace(entry.Name))
            {
                entry.Name = entryName;
                entry.Description = entryDesc;
            }
            await _codexRepository.UpdateAsync(entry);
        }

        return new CodexEntryOutput
        {
            EntryId = entry.EntryId,
            Type = entry.Type,
            Name = entry.Name,
            Description = entry.Description,
            Discovered = entry.Discovered,
            Kills = entry.Kills,
            Obtained = entry.Obtained
        };
    }
}
