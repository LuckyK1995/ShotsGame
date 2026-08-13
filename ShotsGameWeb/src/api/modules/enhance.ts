// 强化/合成 API（宝石合成、附魔书合成）
import { http } from '../client';

export interface MergeGemInput {
  gemId: string;
  count: number;
}

export interface MergeGemOutput {
  success: boolean;
  resultGemId: string | null;
  consumed: number;
  message: string | null;
}

export interface MergeEnchantInput {
  enchantItemId: string;
  count: number;
}

export interface MergeEnchantOutput {
  success: boolean;
  resultEnchantItemId: string | null;
  consumed: number;
  message: string | null;
}

export const enhanceApi = {
  mergeGems: (input: MergeGemInput) => http.post<MergeGemOutput>('/enhance/merge-gems', input),
  mergeEnchants: (input: MergeEnchantInput) =>
    http.post<MergeEnchantOutput>('/enhance/merge-enchants', input),
};
