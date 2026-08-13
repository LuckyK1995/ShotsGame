// 聊天 API
import { http } from '../client';

export interface ChatMessage {
  id: string;
  channel: string;
  playerId: string;
  displayName: string;
  content: string;
  sentAt: string;
}

export interface SendChatInput {
  channel?: string;
  content: string;
}

export const chatApi = {
  /** 获取聊天消息 */
  getMessages: (channel = 'world', limit = 50, beforeTick?: number) =>
    http.get<ChatMessage[]>('/chat/messages', {
      query: { channel, limit, beforeTick },
    }),
  /** 发送聊天消息 */
  send: (input: SendChatInput) => http.post<ChatMessage>('/chat/send', input),
};
