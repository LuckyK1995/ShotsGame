// 仓库容量上限（引擎与 UI 共享，禁止散落硬编码）
export const STORAGE_CAPACITY = {
  equipment: 100,
  inventory: 100,
  gem: 50,
  enhance: 30,
  enchant: 30,
} as const;

export type StorageKey = keyof typeof STORAGE_CAPACITY;
