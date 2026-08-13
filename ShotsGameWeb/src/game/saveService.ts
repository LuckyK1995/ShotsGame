// 存档服务：本地缓存（localStorage）+ 服务端 API 双写双读
// 设计原则：
// 1. 保留 localStorage 同步读写，避免破坏 GameEngine 同步调用链
// 2. 写入时同步落本地 + 异步推送 API（防抖合并，2 秒窗口）
// 3. 启动时由 App 调用 loadFromServer() 拉取最新存档写入 localStorage 缓存
// 4. 网络失败静默降级到 localStorage，不阻塞游戏
import { saveDataApi } from '../api';
import { isAuthenticated } from '../api/client';

const SAVE_KEY = 'shotsGameSave';
const HIGH_SCORE_KEY = 'shotsGameHighScore';

// 防抖：避免高频 saveGame 调用打爆 API
let saveTimer: number | null = null;
let pendingSaveData: string | null = null;
const SAVE_DEBOUNCE_MS = 2000;

// 高分防抖
let highScoreTimer: number | null = null;
let pendingHighScore: number | null = null;

// 同步写本地存档（保持原 localStorage 行为）
export function saveLocal(saveDataObj: unknown): void {
  try {
    const json = JSON.stringify(saveDataObj);
    localStorage.setItem(SAVE_KEY, json);
    // 异步推送 API（防抖）
    scheduleApiSave(json);
  } catch (e) {
    console.warn('[SaveService] saveLocal failed:', e);
  }
}

// 同步读本地存档
export function loadLocal<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('[SaveService] loadLocal failed:', e);
    return null;
  }
}

// 防抖推送 API 存档
function scheduleApiSave(json: string): void {
  pendingSaveData = json;
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void pushSaveToServer(pendingSaveData);
    pendingSaveData = null;
  }, SAVE_DEBOUNCE_MS);
}

async function pushSaveToServer(json: string | null): Promise<void> {
  if (!json || !isAuthenticated()) return;
  try {
    await saveDataApi.save({ saveData: json, version: 1 });
  } catch (e) {
    // 静默降级：网络失败不影响游戏，下次 saveGame 会重试
    console.warn('[SaveService] API save failed, using local fallback:', e);
  }
}

// 强制立即推送（如返回主界面、退出战斗时）
export async function flushSave(): Promise<void> {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (pendingSaveData) {
    const data = pendingSaveData;
    pendingSaveData = null;
    await pushSaveToServer(data);
  }
}

// 从服务端拉取存档，写入 localStorage 缓存
// 返回是否成功（失败时使用本地缓存，不抛错）
export async function loadFromServer(): Promise<boolean> {
  if (!isAuthenticated()) return false;
  try {
    const result = await saveDataApi.load();
    if (result.hasSave && result.saveData) {
      // 用服务端存档覆盖本地缓存
      try {
        localStorage.setItem(SAVE_KEY, result.saveData);
      } catch (e) {
        console.warn('[SaveService] Failed to cache server save locally:', e);
      }
      return true;
    }
    // 服务端确认无存档：清除本地旧存档（首次登录新账号场景）
    // 避免上个账号的本地存档残留被 GameEngine 读取
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn('[SaveService] Failed to clear stale local save:', e);
    }
    return false;
  } catch (e) {
    console.warn('[SaveService] API load failed, using local cache:', e);
    return false;
  }
}

// ─── 高分处理 ───────────────────────────────────────────

export function saveHighScoreLocal(score: number): void {
  try {
    const current = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    if (score > current) {
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      scheduleHighScoreSync(score);
    }
  } catch (e) {
    console.warn('[SaveService] saveHighScoreLocal failed:', e);
  }
}

export function loadHighScoreLocal(): number {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

// 高分通过 PUT /api/player/profile 同步到服务端（avatarUrl 不变，仅更新 score？）
// 实际后端 UpdatePlayerInput 仅支持 displayName/avatarUrl，score 由 battle.submit 写入
// 因此这里仅做本地缓存，服务端权威性由 battle.submit 维护
function scheduleHighScoreSync(score: number): void {
  pendingHighScore = score;
  if (highScoreTimer !== null) {
    window.clearTimeout(highScoreTimer);
  }
  highScoreTimer = window.setTimeout(() => {
    highScoreTimer = null;
    // 高分由 battle.submit 接口在战斗结算时同步到服务端，此处无需额外调用
    pendingHighScore = null;
  }, 3000);
}

// ─── 每日挑战次数缓存 ───────────────────────────────────
// 后端 GameMode API 在 start 时返回 remainingToday，前端缓存到 localStorage 用于 UI 显示
// 注意：服务端是权威源，本地缓存仅用于显示，禁止用于校验

const DAILY_CHALLENGE_KEY = 'shotsGameDailyChallenge';

export interface DailyChallengeCache {
  date: string; // YYYY-MM-DD
  purgatory: { used: number; remaining: number; limit: number };
  material: { used: number; remaining: number; limit: number };
  mirror: { used: number; remaining: number; limit: number };
  worldboss: { used: number; remaining: number; limit: number };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyChallengeCache(): DailyChallengeCache | null {
  try {
    const raw = localStorage.getItem(DAILY_CHALLENGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DailyChallengeCache;
    if (data.date !== todayStr()) return null;
    return data;
  } catch {
    return null;
  }
}

export function setDailyChallengeCache(cache: DailyChallengeCache): void {
  try {
    localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[SaveService] setDailyChallengeCache failed:', e);
  }
}

// 更新某个模式的剩余次数（来自 gameMode.start 响应）
export function updateDailyChallengeRemaining(
  mode: 'purgatory' | 'material' | 'mirror' | 'worldboss',
  remaining: number,
  limit: number
): void {
  const current = getDailyChallengeCache() ?? {
    date: todayStr(),
    purgatory: { used: 0, remaining: limit, limit },
    material: { used: 0, remaining: limit, limit },
    mirror: { used: 0, remaining: limit, limit },
    worldboss: { used: 0, remaining: limit, limit },
  };
  if (current.date !== todayStr()) {
    // 跨日重置
    current.date = todayStr();
  }
  current[mode] = { used: Math.max(0, limit - remaining), remaining, limit };
  setDailyChallengeCache(current);
}

// 读取某模式已用次数（用于 UI 显示，与旧 localStorage['purgatory_challenge'] 行为兼容）
export function getDailyChallengeUsed(mode: 'purgatory' | 'material' | 'mirror' | 'worldboss'): number {
  const cache = getDailyChallengeCache();
  if (!cache) return 0;
  return cache[mode]?.used ?? 0;
}

// ─── 离线收益：基于服务端 LastActiveAt 计算 ───────────────

const LAST_ONLINE_KEY = 'shotsGame_lastOnline';

export function getLastOnline(): number {
  try {
    const raw = localStorage.getItem(LAST_ONLINE_KEY);
    if (raw) return parseInt(raw, 10);
  } catch { /* ignore */ }
  return Date.now();
}

export function setLastOnline(timestamp: number = Date.now()): void {
  try {
    localStorage.setItem(LAST_ONLINE_KEY, timestamp.toString());
  } catch { /* ignore */ }
}
