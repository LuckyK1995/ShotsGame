// 存档 API：使用 SaveDataInput.SaveData 字符串保存整个存档 JSON
import { http } from '../client';

export interface SaveGameInput {
  saveData: string; // 序列化后的存档 JSON 字符串
  version?: number;
}

export interface SaveGameOutput {
  success: boolean;
  savedAt: string;
  message: string | null;
}

export interface LoadGameOutput {
  hasSave: boolean;
  saveData: string | null;
  version: number | null;
  savedAt: string | null;
  message: string | null;
}

export interface ResetSaveOutput {
  success: boolean;
  message: string | null;
}

export const saveDataApi = {
  save: (input: SaveGameInput) => http.post<SaveGameOutput>('/save-data/save', input),
  load: () => http.get<LoadGameOutput>('/save-data/load'),
  reset: () => http.post<ResetSaveOutput>('/save-data/reset'),
};
