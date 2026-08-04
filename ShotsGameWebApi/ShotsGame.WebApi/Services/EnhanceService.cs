using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Enhance;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 合成服务：宝石合成与附魔书合成（同类型低品质合成高品质）
/// </summary>
public class EnhanceService : IEnhanceService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public EnhanceService(
        IPlayerRepository playerRepository,
        IRepository<ItemStack> itemStackRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _itemStackRepository = itemStackRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 合成宝石：消耗指定数量同类型低品质宝石合成更高一级品质宝石（2合1，仅支持普通品质起合成）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">宝石合成参数（宝石类型、原品质、消耗数量）</param>
    /// <returns>合成结果输出（成功/失败、新宝石 ID、消耗数量、提示信息），玩家不存在返回 null</returns>
    public async Task<MergeGemOutput?> MergeGemsAsync(string playerId, MergeGemInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (input.FromRarity != GemRarity.Common)
        {
            return new MergeGemOutput
            {
                Success = false,
                NewGemId = string.Empty,
                ConsumedCount = 0,
                Message = "仅普通品质宝石可合成"
            };
        }

        if (input.Count < 2)
        {
            return new MergeGemOutput
            {
                Success = false,
                NewGemId = string.Empty,
                ConsumedCount = 0,
                Message = "合成需要至少2颗宝石"
            };
        }

        var fromGemId = BuildGemItemId(input.GemType, input.FromRarity);
        var toRarity = input.FromRarity + 1;
        var toGemId = BuildGemItemId(input.GemType, toRarity);

        var gemStack = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == fromGemId && !i.IsDeleted);

        if (gemStack == null || gemStack.Count < input.Count)
        {
            return new MergeGemOutput
            {
                Success = false,
                NewGemId = string.Empty,
                ConsumedCount = 0,
                Message = "宝石数量不足"
            };
        }

        if (input.Count % 2 != 0)
        {
            return new MergeGemOutput
            {
                Success = false,
                NewGemId = string.Empty,
                ConsumedCount = 0,
                Message = "合成数量必须为偶数"
            };
        }

        var producedCount = input.Count / 2;

        gemStack.Count -= input.Count;
        if (gemStack.Count <= 0)
        {
            await _itemStackRepository.DeleteAsync(gemStack.Id);
        }
        else
        {
            await _itemStackRepository.UpdateAsync(gemStack);
        }

        var existingToStack = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == toGemId && !i.IsDeleted);

        if (existingToStack != null)
        {
            existingToStack.Count += producedCount;
            existingToStack.ModifiedAt = DateTimeOffset.UtcNow;
            _context.Inventory.Update(existingToStack);
        }
        else
        {
            var newStack = new ItemStack
            {
                PlayerId = playerId,
                ItemId = toGemId,
                Count = producedCount
            };
            await _itemStackRepository.AddAsync(newStack);
        }

        await _context.SaveChangesAsync();

        return new MergeGemOutput
        {
            Success = true,
            NewGemId = toGemId,
            ConsumedCount = input.Count,
            Message = $"合成成功：消耗{input.Count}颗{GetGemRarityName(input.FromRarity)}{GetGemTypeName(input.GemType)}，获得{producedCount}颗{GetGemRarityName(toRarity)}{GetGemTypeName(input.GemType)}"
        };
    }

    /// <summary>
    /// 合成附魔书：消耗指定数量同属性低品质附魔书合成更高一级品质附魔书（2合1，传说品质已达上限无法继续合成）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">附魔书合成参数（附魔属性、原品质、消耗数量）</param>
    /// <returns>合成结果输出（成功/失败、新附魔书 ID、消耗数量、提示信息），玩家不存在返回 null</returns>
    public async Task<MergeEnchantOutput?> MergeEnchantsAsync(string playerId, MergeEnchantInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        if (input.FromRarity >= EquipRarity.Mythic)
        {
            return new MergeEnchantOutput
            {
                Success = false,
                NewEnchantId = string.Empty,
                ConsumedCount = 0,
                Message = "传说品质已达最高，无法继续合成"
            };
        }

        if (input.Count < 2)
        {
            return new MergeEnchantOutput
            {
                Success = false,
                NewEnchantId = string.Empty,
                ConsumedCount = 0,
                Message = "合成需要至少2本附魔书"
            };
        }

        var fromEnchantId = BuildEnchantItemId(input.Stat, input.FromRarity);
        var toRarity = input.FromRarity + 1;
        var toEnchantId = BuildEnchantItemId(input.Stat, toRarity);

        var enchantStack = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == fromEnchantId && !i.IsDeleted);

        if (enchantStack == null || enchantStack.Count < input.Count)
        {
            return new MergeEnchantOutput
            {
                Success = false,
                NewEnchantId = string.Empty,
                ConsumedCount = 0,
                Message = "附魔书数量不足"
            };
        }

        if (input.Count % 2 != 0)
        {
            return new MergeEnchantOutput
            {
                Success = false,
                NewEnchantId = string.Empty,
                ConsumedCount = 0,
                Message = "合成数量必须为偶数"
            };
        }

        var producedCount = input.Count / 2;

        enchantStack.Count -= input.Count;
        if (enchantStack.Count <= 0)
        {
            await _itemStackRepository.DeleteAsync(enchantStack.Id);
        }
        else
        {
            await _itemStackRepository.UpdateAsync(enchantStack);
        }

        var existingToStack = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == toEnchantId && !i.IsDeleted);

        if (existingToStack != null)
        {
            existingToStack.Count += producedCount;
            existingToStack.ModifiedAt = DateTimeOffset.UtcNow;
            _context.Inventory.Update(existingToStack);
        }
        else
        {
            var newStack = new ItemStack
            {
                PlayerId = playerId,
                ItemId = toEnchantId,
                Count = producedCount
            };
            await _itemStackRepository.AddAsync(newStack);
        }

        await _context.SaveChangesAsync();

        return new MergeEnchantOutput
        {
            Success = true,
            NewEnchantId = toEnchantId,
            ConsumedCount = input.Count,
            Message = $"合成成功：消耗{input.Count}本{GetEquipRarityName(input.FromRarity)}{GetEnchantStatName(input.Stat)}附魔书，获得{producedCount}本{GetEquipRarityName(toRarity)}{GetEnchantStatName(input.Stat)}附魔书"
        };
    }

    private static string BuildGemItemId(GemType type, GemRarity rarity)
    {
        var typeStr = type switch
        {
            GemType.Attack => "attack",
            GemType.Health => "health",
            GemType.Defense => "defense",
            GemType.CritRate => "critrate",
            GemType.Resistance => "resistance",
            _ => type.ToString().ToLowerInvariant()
        };

        var rarityStr = rarity switch
        {
            GemRarity.Common => "common",
            GemRarity.Advanced => "advanced",
            _ => rarity.ToString().ToLowerInvariant()
        };

        return $"gem_{typeStr}_{rarityStr}";
    }

    private static string BuildEnchantItemId(EnchantStat stat, EquipRarity rarity)
    {
        var statStr = stat switch
        {
            EnchantStat.Attack => "attack",
            EnchantStat.Health => "health",
            EnchantStat.Defense => "defense",
            EnchantStat.CritRate => "critrate",
            EnchantStat.Resistance => "resistance",
            _ => stat.ToString().ToLowerInvariant()
        };

        var rarityStr = rarity switch
        {
            EquipRarity.Common => "common",
            EquipRarity.Advanced => "advanced",
            EquipRarity.Fine => "fine",
            EquipRarity.Legendary => "legendary",
            EquipRarity.Epic => "epic",
            EquipRarity.Mythic => "mythic",
            _ => rarity.ToString().ToLowerInvariant()
        };

        return $"enchant_book_{statStr}_{rarityStr}";
    }

    private static string GetGemTypeName(GemType type)
    {
        return type switch
        {
            GemType.Attack => "攻击宝石",
            GemType.Health => "生命宝石",
            GemType.Defense => "防御宝石",
            GemType.CritRate => "暴击宝石",
            GemType.Resistance => "抗性宝石",
            _ => type.ToString()
        };
    }

    private static string GetGemRarityName(GemRarity rarity)
    {
        return rarity switch
        {
            GemRarity.Common => "普通",
            GemRarity.Advanced => "进阶",
            _ => rarity.ToString()
        };
    }

    private static string GetEnchantStatName(EnchantStat stat)
    {
        return stat switch
        {
            EnchantStat.Attack => "攻击",
            EnchantStat.Health => "生命",
            EnchantStat.Defense => "防御",
            EnchantStat.CritRate => "暴击",
            EnchantStat.Resistance => "抗性",
            _ => stat.ToString()
        };
    }

    private static string GetEquipRarityName(EquipRarity rarity)
    {
        return rarity switch
        {
            EquipRarity.Common => "普通",
            EquipRarity.Advanced => "高级",
            EquipRarity.Fine => "精良",
            EquipRarity.Legendary => "传奇",
            EquipRarity.Epic => "史诗",
            EquipRarity.Mythic => "神话",
            _ => rarity.ToString()
        };
    }
}
