// 邮件 API
// 后端 DTO 与前端 Mail 类型存在差异（附件存为 JSON 字符串、类型为枚举、字段名不同），
// 此模块负责调用后端接口并将响应映射为前端游戏使用的 Mail 类型。
import { http } from '../client';
import type { Mail, MailAttachments } from '../../game/types/game';

// 后端 MailType 枚举：0=System, 1=Battle
const MAIL_TYPE_BATTLE = 1;

// 后端原始邮件出参（对应 MailOutput）
interface RawMailOutput {
  id: string;
  type: number; // BackendMailType
  title: string;
  body: string;
  sentAt: string; // ISO 8601
  isRead: boolean;
  isClaimed: boolean;
  attachmentsJson: string | null;
  hasAttachments: boolean;
}

// 后端邮件列表出参（对应 MailListOutput）
interface RawMailListOutput {
  items: RawMailOutput[];
  unreadCount: number;
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// 前端友好的邮件列表出参
export interface MailListOutput {
  mails: Mail[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

// 后端→前端 Mail 映射
function mapMail(raw: RawMailOutput): Mail {
  let attachments: MailAttachments | undefined;
  if (raw.attachmentsJson) {
    try {
      attachments = JSON.parse(raw.attachmentsJson) as MailAttachments;
    } catch {
      // 附件 JSON 解析失败时忽略
    }
  }
  return {
    id: raw.id,
    type: raw.type === MAIL_TYPE_BATTLE ? 'battle' : 'system',
    title: raw.title,
    body: raw.body,
    timestamp: new Date(raw.sentAt).getTime(),
    read: raw.isRead,
    claimed: raw.isClaimed,
    attachments,
  };
}

// 发送邮件入参（系统/管理员用）
export interface SendMailInput {
  playerId: string;
  type?: number;
  title: string;
  body: string;
  attachmentsJson?: string;
}

// 邮件 ID 数组入参（标记已读 / 领取 / 删除 共用）
export interface MailIdsInput {
  mailIds: string[];
}

// 一键领取出参（对应 ClaimAllOutput）
export interface ClaimAllOutput {
  totalGold: number;
  claimedCount: number;
  failedCount: number;
  messages: string[];
}

export const mailApi = {
  // 分页获取邮件列表（已映射为前端 Mail 类型）
  getMails: async (page = 1, pageSize = 50): Promise<MailListOutput> => {
    const raw = await http.get<RawMailListOutput>('/mail', { query: { page, pageSize } });
    return {
      mails: (raw.items || []).map(mapMail),
      total: raw.totalCount,
      page: raw.page,
      pageSize: raw.pageSize,
      unreadCount: raw.unreadCount,
    };
  },
  // 获取单封邮件详情（已映射为前端 Mail 类型）
  getMail: async (mailId: string): Promise<Mail> => {
    const raw = await http.get<RawMailOutput>(`/mail/${mailId}`);
    return mapMail(raw);
  },
  // 发送系统邮件
  sendMail: (input: SendMailInput) => http.post('/mail/send', input),
  // 标记邮件为已读（批量）
  markRead: (input: MailIdsInput) => http.post('/mail/read', input),
  // 领取指定邮件附件（批量）
  claim: (input: MailIdsInput) => http.post<ClaimAllOutput>('/mail/claim', input),
  // 一键领取所有可领取邮件附件
  claimAll: () => http.post<ClaimAllOutput>('/mail/claim-all'),
  // 批量删除邮件
  delete: (input: MailIdsInput) => http.del('/mail/delete', { body: input }),
};
