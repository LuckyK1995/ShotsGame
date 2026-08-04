using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ShotsGame.Core.Data;
using ShotsGame.Core.DTOs.Mail;
using ShotsGame.Core.Entities;
using ShotsGame.Core.Enums;
using ShotsGame.Core.Interfaces;
using ShotsGame.WebApi.Services.Interfaces;

namespace ShotsGame.WebApi.Services;

/// <summary>
/// 邮件服务：邮件列表查询、单封详情、发送邮件、标记已读、一键领取附件、删除邮件
/// </summary>
public class MailService : IMailService
{
    private const int MaxMailCount = 50;
    private const int EquipmentStorageCapacity = 100;
    private const int InventoryCapacity = 100;
    private const int GemCapacity = 50;
    private const int EnhanceCapacity = 30;
    private const int EnchantCapacity = 30;

    private readonly IPlayerRepository _playerRepository;
    private readonly IRepository<Mail> _mailRepository;
    private readonly IRepository<ItemStack> _itemStackRepository;
    private readonly IRepository<Equipment> _equipmentRepository;
    private readonly GameDbContext _context;
    private readonly IMapper _mapper;

    public MailService(
        IPlayerRepository playerRepository,
        IRepository<Mail> mailRepository,
        IRepository<ItemStack> itemStackRepository,
        IRepository<Equipment> equipmentRepository,
        GameDbContext context,
        IMapper mapper)
    {
        _playerRepository = playerRepository;
        _mailRepository = mailRepository;
        _itemStackRepository = itemStackRepository;
        _equipmentRepository = equipmentRepository;
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// 分页获取玩家邮件列表（按发送时间倒序），返回总数、未读数、分页信息及是否有附件标记
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="page">页码（从 1 开始，小于等于 0 视为 1）</param>
    /// <param name="pageSize">每页条数（超出范围时默认为 20）</param>
    /// <returns>邮件列表分页输出，玩家不存在返回 null</returns>
    public async Task<MailListOutput?> GetMailsAsync(string playerId, int page = 1, int pageSize = 20)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        page = page <= 0 ? 1 : page;
        pageSize = pageSize is <= 0 or > 100 ? 20 : pageSize;

        var query = _context.Mails
            .Where(m => m.PlayerId == playerId && !m.IsDeleted);

        var totalCount = await query.CountAsync();
        var unreadCount = await query.CountAsync(m => !m.IsRead);

        var items = await query
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var mailOutputs = _mapper.Map<List<MailOutput>>(items);
        foreach (var mail in mailOutputs)
        {
            mail.HasAttachments = !string.IsNullOrEmpty(mail.AttachmentsJson);
        }

        return new MailListOutput
        {
            Items = mailOutputs,
            UnreadCount = unreadCount,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount
        };
    }

    /// <summary>
    /// 获取单封邮件详情，若邮件未读则自动标记为已读
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="mailId">邮件 ID</param>
    /// <returns>邮件详情输出，玩家不存在或邮件不存在返回 null</returns>
    public async Task<MailOutput?> GetMailAsync(string playerId, string mailId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var mail = await _context.Mails
            .FirstOrDefaultAsync(m => m.Id == mailId && m.PlayerId == playerId && !m.IsDeleted);

        if (mail == null)
        {
            return null;
        }

        var output = _mapper.Map<MailOutput>(mail);
        output.HasAttachments = !string.IsNullOrEmpty(mail.AttachmentsJson);

        if (!mail.IsRead)
        {
            mail.IsRead = true;
            await _mailRepository.UpdateAsync(mail);
            output.IsRead = true;
        }

        return output;
    }

    /// <summary>
    /// 发送邮件给目标玩家（系统邮件或玩家间邮件），超过最大邮件数时删除最早的邮件
    /// </summary>
    /// <param name="playerId">发送方玩家 ID</param>
    /// <param name="input">发送邮件参数（接收方、标题、内容、附件列表）</param>
    /// <returns>发送成功返回 true，失败返回 false</returns>
    public async Task<bool> SendMailAsync(string playerId, SendMailInput input)
    {
        var targetPlayerId = !string.IsNullOrEmpty(input.PlayerId) ? input.PlayerId : playerId;
        var player = await _playerRepository.GetProfileAsync(targetPlayerId);
        if (player == null)
        {
            return false;
        }

        var mail = new Mail
        {
            PlayerId = targetPlayerId,
            Type = input.Type,
            Title = input.Title,
            Body = input.Body,
            AttachmentsJson = input.AttachmentsJson,
            IsRead = false,
            IsClaimed = false,
            SentAt = DateTimeOffset.UtcNow
        };

        await _mailRepository.AddAsync(mail);
        await EnforceMaxMailLimitAsync(targetPlayerId);

        return true;
    }

    /// <summary>
    /// 批量标记指定邮件为已读状态
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">标记已读参数（邮件 ID 列表）</param>
    /// <returns>标记成功返回 true，玩家不存在返回 false</returns>
    public async Task<bool> MarkReadAsync(string playerId, ReadMailInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null || input.MailIds == null || input.MailIds.Length == 0)
        {
            return false;
        }

        var mails = await _context.Mails
            .Where(m => m.PlayerId == playerId && !m.IsDeleted && input.MailIds.Contains(m.Id))
            .ToListAsync();

        foreach (var mail in mails)
        {
            if (!mail.IsRead)
            {
                mail.IsRead = true;
                await _mailRepository.UpdateAsync(mail);
            }
        }

        return true;
    }

    /// <summary>
    /// 领取指定单封邮件的全部附件（金币、经验、装备、道具、宝石等），超出容量的部分自动舍弃
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">领取参数（邮件 ID）</param>
    /// <returns>领取结果输出（获得奖励明细、提示消息），玩家不存在或邮件不存在返回 null</returns>
    public async Task<ClaimAllOutput?> ClaimAttachmentsAsync(string playerId, ClaimMailInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null || input.MailIds == null || input.MailIds.Length == 0)
        {
            return null;
        }

        var result = new ClaimAllOutput();
        var mails = await _context.Mails
            .Where(m => m.PlayerId == playerId && !m.IsDeleted && input.MailIds.Contains(m.Id))
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();

        foreach (var mail in mails)
        {
            if (mail.IsClaimed || string.IsNullOrEmpty(mail.AttachmentsJson))
            {
                continue;
            }

            var attachments = ParseAttachments(mail.AttachmentsJson);
            if (attachments == null)
            {
                continue;
            }

            var (capacityOk, _) = await CheckCapacity(playerId, attachments);
            long goldClaimed = 0;
            var attachmentsToKeep = new MailAttachments();
            var attachmentsToClaim = new MailAttachments();

            if (attachments.Gold > 0)
            {
                goldClaimed = attachments.Gold;
                player.Gold += attachments.Gold;
            }

            if (capacityOk)
            {
                foreach (var item in attachments.Items)
                {
                    await AddOrMergeItemStack(playerId, item.ItemId, item.Count);
                }

                foreach (var equip in attachments.Equipments)
                {
                    equip.PlayerId = playerId;
                    equip.Id = Guid.NewGuid().ToString("N");
                    equip.CreatedAt = DateTimeOffset.UtcNow;
                    await _context.Equipments.AddAsync(equip);
                }

                mail.IsClaimed = true;
                mail.IsRead = true;
                await _mailRepository.UpdateAsync(mail);
                result.ClaimedCount++;
            }
            else
            {
                attachmentsToKeep.Gold = attachments.Gold;
                attachmentsToKeep.Items.AddRange(attachments.Items);
                attachmentsToKeep.Equipments.AddRange(attachments.Equipments);
                mail.AttachmentsJson = JsonSerializer.Serialize(attachmentsToKeep);
                result.FailedCount++;
                result.Messages.Add($"邮件 {mail.Id} 容量不足，附件保留");
            }

            result.TotalGold += goldClaimed;
        }

        await _playerRepository.UpdateAsync(player);
        await _context.SaveChangesAsync();

        return result;
    }

    /// <summary>
    /// 一键领取所有未领取邮件的附件（金币、经验、装备、道具、宝石等合并计算），超出容量部分自动舍弃
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <returns>一键领取结果输出（奖励汇总、邮件数、消息），玩家不存在返回 null</returns>
    public async Task<ClaimAllOutput?> ClaimAllAsync(string playerId)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null)
        {
            return null;
        }

        var result = new ClaimAllOutput();

        var unclaimedMails = await _context.Mails
            .Where(m => m.PlayerId == playerId && !m.IsDeleted && !m.IsClaimed &&
                        !string.IsNullOrEmpty(m.AttachmentsJson))
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();

        if (unclaimedMails.Count == 0)
        {
            return result;
        }

        var allAttachments = new MailAttachments();
        var mailAttachmentsList = new List<(Mail Mail, MailAttachments Attachments)>();

        foreach (var mail in unclaimedMails)
        {
            var att = ParseAttachments(mail.AttachmentsJson);
            if (att == null) continue;
            allAttachments.Gold += att.Gold;
            allAttachments.Items.AddRange(att.Items);
            allAttachments.Equipments.AddRange(att.Equipments);
            mailAttachmentsList.Add((mail, att));
        }

        var (capacityOk, message) = await CheckCapacity(playerId, allAttachments);
        if (!capacityOk)
        {
            result.FailedCount = unclaimedMails.Count;
            result.Messages.Add(message ?? "背包容量不足，无法领取所有附件");
            return result;
        }

        player.Gold += allAttachments.Gold;
        result.TotalGold = allAttachments.Gold;

        foreach (var item in allAttachments.Items)
        {
            await AddOrMergeItemStack(playerId, item.ItemId, item.Count);
        }

        foreach (var equip in allAttachments.Equipments)
        {
            equip.PlayerId = playerId;
            equip.Id = Guid.NewGuid().ToString("N");
            equip.CreatedAt = DateTimeOffset.UtcNow;
            await _context.Equipments.AddAsync(equip);
        }

        foreach (var (mail, _) in mailAttachmentsList)
        {
            mail.IsClaimed = true;
            mail.IsRead = true;
            await _mailRepository.UpdateAsync(mail);
            result.ClaimedCount++;
        }

        await _playerRepository.UpdateAsync(player);
        await _context.SaveChangesAsync();

        return result;
    }

    /// <summary>
    /// 批量软删除玩家指定的邮件（邮件中的附件若未领取则一并丢弃）
    /// </summary>
    /// <param name="playerId">玩家 ID</param>
    /// <param name="input">删除参数（邮件 ID 列表）</param>
    /// <returns>删除成功返回 true，玩家不存在或邮件 ID 为空返回 false</returns>
    public async Task<bool> DeleteMailsAsync(string playerId, DeleteMailInput input)
    {
        var player = await _playerRepository.GetProfileAsync(playerId);
        if (player == null || input.MailIds == null || input.MailIds.Length == 0)
        {
            return false;
        }

        foreach (var mailId in input.MailIds)
        {
            await _mailRepository.DeleteAsync(mailId);
        }

        return true;
    }

    private async Task EnforceMaxMailLimitAsync(string playerId)
    {
        var allMails = await _context.Mails
            .Where(m => m.PlayerId == playerId && !m.IsDeleted)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        var toRemove = allMails.Count - MaxMailCount;
        if (toRemove > 0)
        {
            foreach (var mail in allMails.Take(toRemove))
            {
                await _mailRepository.DeleteAsync(mail.Id);
            }
        }
    }

    private async Task<(bool Ok, string? Message)> CheckCapacity(string playerId, MailAttachments attachments)
    {
        var equipCount = await _context.Equipments
            .CountAsync(e => e.PlayerId == playerId && !e.IsDeleted);
        if (equipCount + attachments.Equipments.Count > EquipmentStorageCapacity)
        {
            return (false, $"装备仓库容量不足（需 {attachments.Equipments.Count}，剩余 {EquipmentStorageCapacity - equipCount}）");
        }

        var allItems = await _context.Inventory
            .Where(i => i.PlayerId == playerId && !i.IsDeleted)
            .ToListAsync();

        int invCount = 0, gemCount = 0, enhanceCount = 0, enchantCount = 0;
        foreach (var it in allItems)
        {
            if (it.ItemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase)) gemCount++;
            else if (it.ItemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase)) enchantCount++;
            else if (it.ItemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase)) enhanceCount++;
            else invCount++;
        }

        var newInvItems = new HashSet<string>();
        var newGemItems = new HashSet<string>();
        var newEnhanceItems = new HashSet<string>();
        var newEnchantItems = new HashSet<string>();

        foreach (var item in attachments.Items)
        {
            var exist = allItems.Any(i => i.ItemId == item.ItemId);
            if (exist) continue;

            if (item.ItemId.StartsWith("gem_", StringComparison.OrdinalIgnoreCase)) newGemItems.Add(item.ItemId);
            else if (item.ItemId.StartsWith("enchant_", StringComparison.OrdinalIgnoreCase)) newEnchantItems.Add(item.ItemId);
            else if (item.ItemId.StartsWith("enhance_", StringComparison.OrdinalIgnoreCase)) newEnhanceItems.Add(item.ItemId);
            else newInvItems.Add(item.ItemId);
        }

        if (invCount + newInvItems.Count > InventoryCapacity)
            return (false, "道具背包容量不足");
        if (gemCount + newGemItems.Count > GemCapacity)
            return (false, "宝石背包容量不足");
        if (enhanceCount + newEnhanceItems.Count > EnhanceCapacity)
            return (false, "强化背包容量不足");
        if (enchantCount + newEnchantItems.Count > EnchantCapacity)
            return (false, "附魔背包容量不足");

        return (true, null);
    }

    private async Task AddOrMergeItemStack(string playerId, string itemId, int count)
    {
        if (count <= 0) return;

        var existing = await _context.Inventory
            .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == itemId && !i.IsDeleted);

        if (existing != null)
        {
            existing.Count += count;
            existing.ModifiedAt = DateTimeOffset.UtcNow;
            _context.Inventory.Update(existing);
        }
        else
        {
            await _itemStackRepository.AddAsync(new ItemStack
            {
                PlayerId = playerId,
                ItemId = itemId,
                Count = count
            });
        }
    }

    private static MailAttachments? ParseAttachments(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<MailAttachments>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch
        {
            return null;
        }
    }

    private class MailAttachments
    {
        public long Gold { get; set; }
        public List<MailItemAttachment> Items { get; set; } = new();
        public List<Equipment> Equipments { get; set; } = new();
    }

    private class MailItemAttachment
    {
        public string ItemId { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
