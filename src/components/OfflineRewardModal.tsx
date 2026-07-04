import { useState, useEffect } from 'react';
import type { OfflineReward } from '../game/types/game';

interface OfflineRewardModalProps {
  playerLevel: number;
  highestWave: number;
}

const STORAGE_KEY = 'shotsGame_lastOnline';
const MAX_OFFLINE_HOURS = 8;
const MIN_OFFLINE_SECONDS = 60;

function calculateOfflineReward(elapsedSeconds: number, playerLevel: number, highestWave: number): OfflineReward {
  const cappedSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_HOURS * 3600);

  const baseGoldPerMin = 10 + playerLevel * 5 + highestWave * 8;
  const baseExpPerMin = 5 + playerLevel * 3 + highestWave * 5;

  const minutes = cappedSeconds / 60;
  const gold = Math.floor(baseGoldPerMin * minutes);
  const exp = Math.floor(baseExpPerMin * minutes);

  const items: { itemId: string; count: number }[] = [];
  const itemDropMinutes = Math.floor(minutes / 5);
  if (itemDropMinutes > 0) {
    if (Math.random() < 0.5) {
      items.push({ itemId: 'health_potion', count: Math.min(itemDropMinutes, 10) });
    }
    if (Math.random() < 0.3) {
      items.push({ itemId: 'attack_boost', count: Math.min(Math.floor(itemDropMinutes / 2), 5) });
    }
    if (Math.random() < 0.2 && highestWave >= 5) {
      items.push({ itemId: 'magnet', count: Math.min(Math.floor(itemDropMinutes / 3), 3) });
    }
  }

  return {
    gold,
    exp,
    items,
    duration: cappedSeconds,
  };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return hours + '小时' + minutes + '分' + secs + '秒';
  } else if (minutes > 0) {
    return minutes + '分' + secs + '秒';
  }
  return secs + '秒';
}

export function OfflineRewardModal({ playerLevel, highestWave }: OfflineRewardModalProps) {
  const [reward, setReward] = useState<OfflineReward | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastOnline = localStorage.getItem(STORAGE_KEY);

    if (!lastOnline) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      return;
    }

    const lastTime = parseInt(lastOnline);
    const now = Date.now();
    const elapsedSeconds = (now - lastTime) / 1000;

    if (elapsedSeconds >= MIN_OFFLINE_SECONDS) {
      const calculated = calculateOfflineReward(elapsedSeconds, playerLevel, highestWave);
      if (calculated.gold > 0 || calculated.exp > 0) {
        setReward(calculated);
        setShow(true);
      }
    }

    localStorage.setItem(STORAGE_KEY, now.toString());
  }, [playerLevel, highestWave]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }, 30000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, []);

  const handleClaim = () => {
    const engine = (window as any).__gameEngine;
    if (engine && reward) {
      if (engine.player) {
        engine.player.gold += reward.gold;
        if (engine.onPlayerChange) {
          engine.onPlayerChange({ ...engine.player });
        }
      }
      if (engine.addExp) {
        engine.addExp(reward.exp);
      }
      if (reward.items.length > 0 && engine.addToInventory) {
        for (const item of reward.items) {
          for (let i = 0; i < item.count; i++) {
            engine.addToInventory(item.itemId);
          }
        }
      }
    }
    setShow(false);
    setReward(null);
  };

  if (!show || !reward) return null;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={handleClaim}>
      <div
        className="relative w-[400px] max-w-[90vw] p-5"
        style={{
          background: 'linear-gradient(180deg, #5D4037 0%, #4A3728 50%, #3D2914 100%)',
          border: '4px solid #3D2914',
          boxShadow: 'inset 2px 2px 0 #6B5344, inset -2px -2px 0 #2D1F0E, 6px 6px 0 #1A0F05',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div
            className="text-2xl mb-2"
            style={{ fontFamily: '"Press Start 2P", monospace', color: '#FFE066', textShadow: '3px 3px 0 #3D2914' }}
          >
            🏠 离线收益
          </div>
          <div className="text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace', color: '#DEB887' }}>
            你离开了一段时间，角色自动战斗获得了奖励
          </div>
        </div>

        <div className="text-center mb-4 py-2" style={{ background: 'rgba(0,0,0,0.3)', border: '2px solid #3D2914' }}>
          <div className="text-[8px] mb-1" style={{ fontFamily: '"Press Start 2P", monospace', color: '#8B7355' }}>
            离线时长
          </div>
          <div className="text-sm" style={{ fontFamily: '"Press Start 2P", monospace', color: '#DEB887', fontSize: '10px' }}>
            {formatDuration(reward.duration)}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div
            className="flex items-center justify-between p-2"
            style={{ background: 'rgba(255,224,102,0.1)', border: '2px solid #8B6914' }}
          >
            <span className="text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace', color: '#DEB887' }}>
              💰 金币
            </span>
            <span className="text-xs font-bold" style={{ fontFamily: '"Press Start 2P", monospace', color: '#FFE066', fontSize: '10px' }}>
              +{reward.gold}
            </span>
          </div>

          <div
            className="flex items-center justify-between p-2"
            style={{ background: 'rgba(100,200,100,0.1)', border: '2px solid #8B6914' }}
          >
            <span className="text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace', color: '#DEB887' }}>
              ⭐ 经验
            </span>
            <span className="text-xs font-bold" style={{ fontFamily: '"Press Start 2P", monospace', color: '#90EE90', fontSize: '10px' }}>
              +{reward.exp}
            </span>
          </div>

          {reward.items.length > 0 && (
            <div className="p-2" style={{ background: 'rgba(200,150,100,0.1)', border: '2px solid #8B6914' }}>
              <div className="text-[8px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace', color: '#DEB887' }}>
                🎒 获得物品
              </div>
              <div className="flex flex-wrap gap-2">
                {reward.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #5D4037' }}
                  >
                    <span className="text-[7px]" style={{ fontFamily: '"Press Start 2P", monospace', color: '#DEB887' }}>
                      {item.itemId === 'health_potion' ? '🧪' : item.itemId === 'attack_boost' ? '⚔️' : item.itemId === 'magnet' ? '🧲' : '📦'}
                    </span>
                    <span className="text-[7px]" style={{ fontFamily: '"Press Start 2P", monospace', color: '#FFE066' }}>
                      x{item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          className="w-full py-3 transition-all hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #E08030 0%, #8B4513 50%, #6B3A0D 100%)',
            border: '3px solid #3D2914',
            boxShadow: 'inset 2px 2px 0 #F0A050, inset -2px -2px 0 #4A2A08, 3px 3px 0 #1A0F05',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#FFE066',
            textShadow: '1px 1px 0 #3D2914',
          }}
          onClick={handleClaim}
        >
          领取奖励
        </button>

        <div className="text-center mt-3">
          <div className="text-[7px]" style={{ fontFamily: '"Press Start 2P", monospace', color: '#6B5344' }}>
            最多累积8小时离线收益
          </div>
        </div>
      </div>
    </div>
  );
}
