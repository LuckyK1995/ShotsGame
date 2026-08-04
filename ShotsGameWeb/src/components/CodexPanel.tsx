import { useMemo, useState, memo, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { WEAPONS, ARMORS, RARITY_COLORS } from '../game/data/equipment';
import { ENEMY_CONFIGS, type EnemyConfig } from '../game/data/enemies';
import type { Equipment, Achievement } from '../game/types/game';
import { neonCyan, neonPurple, neonPink, neonYellow, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalHudBackground } from './ModalHudBackground';

const rarityColors: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

const rarityNames: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const enemyIcons: Record<string, string> = {
  mutant: '👾',
  raider: '🏴‍☠️',
  infected: '🧟',
  brute: '💪',
  heavy_trooper: '🔰',
  mech_soldier: '🤖',
  war_tank: '🚜',
  alien_hive: '🟣',
};

type TabType = 'enemies' | 'equipment' | 'achievements';
type AchievementSubTab = 'system' | 'level';

interface CodexEngineRef {
  current: {
    claimAchievement?: (id: string) => { success: boolean; reason?: string };
  } | null;
}

interface CodexPanelProps {
  engineRef?: CodexEngineRef;
}

function CodexPanelImpl({ engineRef }: CodexPanelProps) {
  // 性能优化：使用细粒度 selector
  const codexEntries = useGameStore(s => s.codexEntries);
  const player = useGameStore(s => s.player);
  const achievements = useGameStore(s => s.achievements);
  const [activeTab, setActiveTab] = useState<TabType>('enemies');
  const [achievementSubTab, setAchievementSubTab] = useState<AchievementSubTab>('system');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [claimToast, setClaimToast] = useState<string | null>(null);

  const enemyList = useMemo(() => {
    return Object.entries(ENEMY_CONFIGS).map(([id, config]) => ({
      id,
      ...config,
    }));
  }, []);

  const discoveredEnemyNames = useMemo(() => {
    return new Set(
      codexEntries
        .filter(e => e.type === 'enemy' && e.discovered)
        .map(e => e.name)
    );
  }, [codexEntries]);

  const allEquipment = useMemo(() => {
    const order = ['common', 'rare', 'epic', 'legendary'];
    return [...WEAPONS, ...ARMORS].sort(
      (a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity),
    );
  }, []);

  const discoveredEquipIds = useMemo(() => {
    return new Set(
      codexEntries
        .filter(e => e.type === 'equipment' && e.discovered)
        .map(e => e.id.replace('equip_', ''))
    );
  }, [codexEntries]);

  const selectedEnemy = activeTab === 'enemies' && selectedItemId
    ? enemyList.find(e => e.id === selectedItemId)
    : null;

  const selectedEquip = activeTab === 'equipment' && selectedItemId
    ? allEquipment.find(e => e.id === selectedItemId)
    : null;

  const selectedAchievement = activeTab === 'achievements' && selectedItemId
    ? achievements.find(a => a.id === selectedItemId)
    : null;

  const closeModal = () => setSelectedItemId(null);

  // 当前子页签的成就列表
  const visibleAchievements = useMemo(() => {
    if (activeTab !== 'achievements') return [];
    return achievements.filter(a => a.category === achievementSubTab);
  }, [achievements, activeTab, achievementSubTab]);

  // 领取成就奖励
  const handleClaim = useCallback((achievementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = engineRef?.current?.claimAchievement?.(achievementId);
    if (result?.success) {
      setClaimToast('领取成功');
    } else {
      setClaimToast(result?.reason || '领取失败');
    }
  }, [engineRef]);

  // 一键领取所有可领取的成就
  const claimableCount = useMemo(() => {
    if (activeTab !== 'achievements') return 0;
    return visibleAchievements.filter(a => a.unlocked && !a.claimed).length;
  }, [visibleAchievements, activeTab]);

  const handleClaimAll = useCallback(() => {
    if (!engineRef?.current?.claimAchievement || claimableCount === 0) return;
    let successCount = 0;
    for (const achievement of visibleAchievements) {
      if (achievement.unlocked && !achievement.claimed) {
        const result = engineRef.current.claimAchievement(achievement.id);
        if (result?.success) successCount++;
      }
    }
    setClaimToast(successCount > 0 ? `一键领取成功 ${successCount} 个` : '没有可领取的成就');
  }, [engineRef, visibleAchievements, claimableCount]);

  // 领取提示 toast 自动消失
  useEffect(() => {
    if (!claimToast) return;
    const id = setTimeout(() => setClaimToast(null), 1200);
    return () => clearTimeout(id);
  }, [claimToast]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'enemies', label: '敌人', icon: '👾' },
    { id: 'equipment', label: '装备', icon: '⚔' },
    { id: 'achievements', label: '成就', icon: '🏆' },
  ];

  const discoveredCount = activeTab === 'enemies'
    ? discoveredEnemyNames.size
    : activeTab === 'equipment'
      ? discoveredEquipIds.size
      : visibleAchievements.filter(a => a.unlocked).length;
  const totalCount = activeTab === 'enemies'
    ? enemyList.length
    : activeTab === 'equipment'
      ? allEquipment.length
      : visibleAchievements.length;

  return (
    <div className="h-full p-1.5 flex flex-col relative" style={{ color: '#E0E0FF' }}>
      <div className="flex justify-between items-center mb-1.5 gap-2">
        <span style={{ ...neonText, fontSize: '9px', color: neonPurple, letterSpacing: '1px' }}>
          图鉴
        </span>
        <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', color: '#8B80A0' }}>
          {discoveredCount}/{totalCount}
        </span>
      </div>

      <div className="flex gap-1 mb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className="flex-1 px-2 py-1"
              style={{
                background: isActive
                  ? 'rgba(176, 38, 255, 0.15)'
                  : 'rgba(19, 16, 37, 0.5)',
                border: `1px solid ${isActive ? 'rgba(176, 38, 255, 0.35)' : 'rgba(100, 100, 130, 0.15)'}`,
                borderRadius: '6px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                fontWeight: 600,
                color: isActive ? neonPurple : '#8B80A0',
                cursor: 'pointer',
                boxShadow: isActive ? '0 0 6px rgba(176, 38, 255, 0.2)' : 'none',
                transition: 'all 0.2s',
              }}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedItemId(null);
              }}
            >
              <span style={{ fontSize: '9px' }}>{tab.icon}</span>
              <span className="ml-1">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'enemies' && (
          <div className="grid grid-cols-6 gap-1">
            {enemyList.map((enemy) => {
              const isDiscovered = discoveredEnemyNames.has(enemy.name);
              const isBoss = enemy.type === 'boss';
              const isElite = enemy.type === 'elite';
              const borderColor = isBoss
                ? 'rgba(255, 45, 85, 0.4)'
                : isElite
                  ? 'rgba(176, 38, 255, 0.5)'
                  : 'rgba(0, 245, 212, 0.3)';
              const glowColor = isBoss
                ? '0 0 6px rgba(255, 45, 85, 0.25)'
                : isElite
                  ? '0 0 5px rgba(176, 38, 255, 0.3)'
                  : '0 0 4px rgba(0, 245, 212, 0.2)';
              const icon = enemyIcons[enemy.id] || '👾';
              return (
                <div
                  key={enemy.id}
                  className={`aspect-square w-full flex flex-col items-center justify-center cursor-pointer relative`}
                  style={{
                    background: isDiscovered
                      ? 'rgba(19, 16, 37, 0.6)'
                      : 'rgba(19, 16, 37, 0.2)',
                    border: `2.5px solid ${isDiscovered ? borderColor : 'rgba(100, 100, 130, 0.15)'}`,
                    borderRadius: '8px',
                    opacity: isDiscovered ? 1 : 0.5,
                    boxShadow: isDiscovered ? glowColor : 'none',
                  }}
                  onClick={() => isDiscovered && setSelectedItemId(enemy.id)}
                >
                  <span
                    className="text-xl"
                    style={{
                      filter: isDiscovered
                        ? isBoss
                          ? 'drop-shadow(0 0 4px rgba(255, 45, 85, 0.5))'
                          : isElite
                            ? 'drop-shadow(0 0 3px rgba(176, 38, 255, 0.5))'
                            : 'drop-shadow(0 0 3px rgba(0, 245, 212, 0.4))'
                        : 'brightness(0) invert(0.3)',
                    }}
                  >
                    {isDiscovered ? icon : '?'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="grid grid-cols-6 gap-1">
            {allEquipment.map((item) => {
              const isDiscovered = discoveredEquipIds.has(item.rarity);
              const rarityColor = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF';
              const rarityBorder = `${rarityColor}50`;
              const glow = `0 0 6px ${rarityColor}30`;
              return (
                <div
                  key={item.id}
                  className={`aspect-square w-full flex flex-col items-center justify-center cursor-pointer relative`}
                  style={{
                    background: isDiscovered
                      ? 'rgba(19, 16, 37, 0.6)'
                      : 'rgba(19, 16, 37, 0.2)',
                    border: `2.5px solid ${isDiscovered ? rarityBorder : 'rgba(100, 100, 130, 0.15)'}`,
                    borderRadius: '8px',
                    opacity: isDiscovered ? 1 : 0.5,
                    boxShadow: isDiscovered ? glow : 'none',
                  }}
                  onClick={() => isDiscovered && setSelectedItemId(item.id)}
                >
                  <span
                    className="text-lg"
                    style={{
                      filter: isDiscovered ? `drop-shadow(0 0 3px ${rarityColor}60)` : 'brightness(0) invert(0.3)',
                    }}
                  >
                    {isDiscovered ? item.icon : '?'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="flex flex-col h-full">
            {/* 成就子页签：系统成就 / 等级成就 */}
            <div className="flex gap-1 mb-1.5" style={{ flexShrink: 0 }}>
              {([
                { id: 'system' as const, label: '系统成就', icon: '⚙️' },
                { id: 'level' as const, label: '等级成就', icon: '⭐' },
              ]).map((sub) => {
                const isActive = achievementSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    className="flex-1 px-2 py-1"
                    style={{
                      background: isActive ? hexToRgba(neonYellow, 0.15) : 'rgba(19, 16, 37, 0.5)',
                      border: `1px solid ${isActive ? hexToRgba(neonYellow, 0.4) : 'rgba(100, 100, 130, 0.15)'}`,
                      borderRadius: '6px',
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '8px',
                      fontWeight: 600,
                      color: isActive ? neonYellow : '#8B80A0',
                      cursor: 'pointer',
                      boxShadow: isActive ? `0 0 6px ${hexToRgba(neonYellow, 0.2)}` : 'none',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      setAchievementSubTab(sub.id);
                      setSelectedItemId(null);
                    }}
                  >
                    <span style={{ fontSize: '9px' }}>{sub.icon}</span>
                    <span className="ml-1">{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 成就列表（宝石列表模式：横向单行 图标+名称+进度 | 领取按钮） */}
            <div className="flex flex-col gap-1 overflow-y-auto" style={{ flex: 1, minHeight: 0, paddingRight: '2px' }}>
              {visibleAchievements.length === 0 && (
                <div className="flex items-center justify-center h-full" style={{ ...neonText, fontSize: '8px', color: '#5A5A7A' }}>
                  暂无成就
                </div>
              )}
              {visibleAchievements.map((achievement) => {
                const isUnlocked = achievement.unlocked;
                const isClaimed = achievement.claimed;
                const canClaim = isUnlocked && !isClaimed;
                const progressPct = Math.min(100, (achievement.progress / achievement.target) * 100);

                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-1.5"
                    style={{
                      padding: '3px 5px',
                      background: isClaimed
                        ? 'rgba(40, 60, 40, 0.4)'
                        : canClaim
                          ? `linear-gradient(90deg, ${hexToRgba(neonYellow, 0.18)} 0%, ${hexToRgba(neonYellow, 0.05)} 100%)`
                          : isUnlocked
                            ? 'rgba(19, 16, 37, 0.6)'
                            : 'rgba(19, 16, 37, 0.4)',
                      border: `1px solid ${canClaim ? hexToRgba(neonYellow, 0.5) : isClaimed ? 'rgba(100, 200, 100, 0.3)' : 'rgba(100, 100, 130, 0.2)'}`,
                      borderRadius: '4px',
                      boxShadow: canClaim ? `0 0 4px ${hexToRgba(neonYellow, 0.3)}` : 'none',
                      cursor: 'pointer',
                      opacity: isUnlocked || canClaim ? 1 : 0.85,
                    }}
                    onClick={() => setSelectedItemId(achievement.id)}
                  >
                    {/* 左侧：图标 + 名称 + 进度 */}
                    <div className="flex items-center gap-1.5" style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '14px',
                          flexShrink: 0,
                          filter: isUnlocked || canClaim
                            ? `drop-shadow(0 0 3px ${hexToRgba(neonYellow, 0.5)})`
                            : 'brightness(0.4) grayscale(0.8)',
                        }}
                      >
                        {achievement.icon}
                      </span>
                      <div className="flex flex-col" style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            ...neonText,
                            fontSize: '8px',
                            fontWeight: 700,
                            color: canClaim ? neonYellow : isClaimed ? '#A0E0A0' : isUnlocked ? '#FFE066' : '#B0A8C8',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {achievement.name}
                        </span>
                        <span style={{ ...neonText, fontSize: '6.5px', color: '#8B80A0', marginTop: '1px' }}>
                          {achievement.description}
                        </span>
                        {/* 进度条 */}
                        <div className="flex items-center gap-1" style={{ marginTop: '2px' }}>
                          <div style={{ flex: 1, height: '3px', background: 'rgba(100, 100, 130, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${progressPct}%`,
                              background: canClaim ? neonYellow : isClaimed ? '#80E080' : neonPurple,
                              borderRadius: '2px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{ ...neonText, fontSize: '6px', color: '#8B80A0', flexShrink: 0 }}>
                            {achievement.progress}/{achievement.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧：领取按钮 / 状态 */}
                    <div style={{ flexShrink: 0 }}>
                      {canClaim ? (
                        <button
                          onClick={(e) => handleClaim(achievement.id, e)}
                          style={{
                            padding: '3px 8px',
                            background: `linear-gradient(180deg, ${hexToRgba(neonYellow, 0.3)} 0%, ${hexToRgba(neonYellow, 0.15)} 100%)`,
                            border: `1px solid ${hexToRgba(neonYellow, 0.6)}`,
                            borderRadius: '4px',
                            ...neonText,
                            fontSize: '7px',
                            fontWeight: 700,
                            color: neonYellow,
                            cursor: 'pointer',
                            boxShadow: `0 0 6px ${hexToRgba(neonYellow, 0.3)}`,
                            textShadow: `0 0 3px ${hexToRgba(neonYellow, 0.5)}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          领取
                        </button>
                      ) : isClaimed ? (
                        <span style={{ ...neonText, fontSize: '7px', color: '#80C080', whiteSpace: 'nowrap' }}>
                          已领取
                        </span>
                      ) : (
                        <span style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', whiteSpace: 'nowrap' }}>
                          {achievement.reward}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 一键领取按钮 */}
            {claimableCount > 0 && (
              <button
                onClick={handleClaimAll}
                style={{
                  width: '80px',
                  flexShrink: 0,
                  marginTop: '4px',
                  padding: '5px 0',
                  background: `linear-gradient(180deg, ${hexToRgba(neonYellow, 0.3)} 0%, ${hexToRgba(neonYellow, 0.15)} 100%)`,
                  border: `1px solid ${hexToRgba(neonYellow, 0.6)}`,
                  borderRadius: '6px',
                  ...neonText,
                  fontSize: '8px',
                  fontWeight: 700,
                  color: neonYellow,
                  cursor: 'pointer',
                  boxShadow: `0 0 8px ${hexToRgba(neonYellow, 0.3)}`,
                  textShadow: `0 0 4px ${hexToRgba(neonYellow, 0.5)}`,
                  transition: 'all 0.2s',
                }}
              >
                一键领取（{claimableCount}）
              </button>
            )}

            {/* 领取提示 toast */}
            {claimToast && (
              <div
                className="absolute left-1/2 top-2"
                style={{
                  transform: 'translateX(-50%)',
                  ...neonText,
                  fontSize: '9px',
                  fontWeight: 700,
                  color: claimToast === '领取成功' ? neonYellow : '#FF6B6B',
                  background: claimToast === '领取成功' ? 'rgba(40, 36, 10, 0.92)' : 'rgba(40, 10, 25, 0.92)',
                  border: `1px solid ${claimToast === '领取成功' ? hexToRgba(neonYellow, 0.5) : 'rgba(255, 107, 107, 0.5)'}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 30,
                }}
              >
                {claimToast}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedEnemy && (
        <div
          className="absolute inset-0 bg-black/70 flex items-center justify-center z-20"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={closeModal}
        >
          <div
            className="relative w-72 p-4"
            style={{
              background: 'rgba(19, 16, 37, 0.95)',
              border: `1px solid ${selectedEnemy.type === 'boss' ? 'rgba(255, 45, 85, 0.4)' : selectedEnemy.type === 'elite' ? 'rgba(176, 38, 255, 0.5)' : 'rgba(0, 245, 212, 0.4)'}`,
              borderRadius: '14px',
              boxShadow: selectedEnemy.type === 'boss'
                ? '0 0 30px rgba(255, 45, 85, 0.25)'
                : selectedEnemy.type === 'elite'
                  ? '0 0 30px rgba(176, 38, 255, 0.3)'
                  : `0 0 30px ${neonCyan}20`,
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />
            <div className="relative" style={{ zIndex: 1 }}>
            <button
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center"
              style={{
                background: 'rgba(255, 45, 85, 0.15)',
                border: '1px solid rgba(255, 45, 85, 0.3)',
                borderRadius: '6px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '11px',
                fontWeight: 700,
                color: '#FF2D55',
                cursor: 'pointer',
              }}
              onClick={closeModal}
            >
              ×
            </button>

            <div className="flex items-center gap-3 mb-3 pr-8">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{
                  background: selectedEnemy.type === 'boss'
                    ? 'rgba(255, 45, 85, 0.1)'
                    : selectedEnemy.type === 'elite'
                      ? 'rgba(176, 38, 255, 0.1)'
                      : 'rgba(0, 245, 212, 0.1)',
                  border: `1.5px solid ${selectedEnemy.type === 'boss' ? '#FF2D55' : selectedEnemy.type === 'elite' ? neonPurple : neonCyan}`,
                  borderRadius: '10px',
                  boxShadow: selectedEnemy.type === 'boss'
                    ? '0 0 12px rgba(255, 45, 85, 0.3)'
                    : selectedEnemy.type === 'elite'
                      ? `0 0 12px ${neonPurple}40`
                      : `0 0 12px ${neonCyan}30`,
                }}
              >
                <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}>
                  {enemyIcons[selectedEnemy.id] || '👾'}
                </span>
              </div>
              <div>
                <div
                  style={{
                    ...neonText,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: selectedEnemy.type === 'boss' ? '#FF2D55' : selectedEnemy.type === 'elite' ? neonPurple : neonCyan,
                    textShadow: selectedEnemy.type === 'boss'
                      ? '0 0 6px rgba(255, 45, 85, 0.5)'
                      : selectedEnemy.type === 'elite'
                        ? `0 0 6px ${neonPurple}40`
                        : `0 0 6px ${neonCyan}40`,
                  }}
                >
                  {selectedEnemy.name}
                </div>
                <div className="mt-1" style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>
                  {selectedEnemy.type === 'boss' ? '首领敌人' : selectedEnemy.type === 'elite' ? '精英敌人' : '普通敌人'}
                </div>
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: '#FF2D55' }}>生命</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                    {selectedEnemy.baseHealth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: '#FF9500' }}>伤害</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                    {selectedEnemy.baseDamage}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: '#00F5D4' }}>速度</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                    {selectedEnemy.baseSpeed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFE600' }}>经验值</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                    {selectedEnemy.baseExp}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: '#B0A8C8' }}>掉落率</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                    {Math.round(selectedEnemy.dropRate * 100)}%
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {selectedEquip && (
        <div
          className="absolute inset-0 bg-black/70 flex items-center justify-center z-20"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={closeModal}
        >
          <div
            className="relative w-72 p-4"
            style={{
              background: 'rgba(19, 16, 37, 0.95)',
              border: `1px solid ${RARITY_COLORS[selectedEquip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}60`,
              borderRadius: '14px',
              boxShadow: `0 0 30px ${RARITY_COLORS[selectedEquip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}30`,
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />
            <div className="relative" style={{ zIndex: 1 }}>
            <button
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center"
              style={{
                background: 'rgba(255, 45, 85, 0.15)',
                border: '1px solid rgba(255, 45, 85, 0.3)',
                borderRadius: '6px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '11px',
                fontWeight: 700,
                color: '#FF2D55',
                cursor: 'pointer',
              }}
              onClick={closeModal}
            >
              ×
            </button>

            <div className="flex items-center gap-3 mb-3 pr-8">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{
                  background: `${RARITY_COLORS[selectedEquip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}15`,
                  border: `1.5px solid ${RARITY_COLORS[selectedEquip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}`,
                  borderRadius: '10px',
                  boxShadow: `0 0 12px ${RARITY_COLORS[selectedEquip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}40`,
                }}
              >
                <span className="text-3xl">{selectedEquip.icon}</span>
              </div>
              <div>
                <div
                  style={{
                    ...neonText,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: RARITY_COLORS[selectedEquip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF',
                    textShadow: `0 0 6px ${RARITY_COLORS[selectedEquip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}50`,
                  }}
                >
                  {selectedEquip.name}
                </div>
                <div className="mt-1" style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>
                  {rarityNames[selectedEquip.rarity]}
                </div>
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
              <p className="mb-3" style={{ ...neonText, fontSize: '8px', color: '#B0A8C8', lineHeight: '1.6' }}>
                {selectedEquip.description}
              </p>
              <div className="space-y-1.5">
                {selectedEquip.attack && selectedEquip.attack > 0 && (
                  <div className="flex justify-between">
                    <span style={{ ...neonText, fontSize: '8px', color: '#FF2D55' }}>攻击力</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                      +{selectedEquip.attack}
                    </span>
                  </div>
                )}
                {selectedEquip.health && selectedEquip.health > 0 && (
                  <div className="flex justify-between">
                    <span style={{ ...neonText, fontSize: '8px', color: '#34C759' }}>生命值</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                      +{selectedEquip.health}
                    </span>
                  </div>
                )}
                {selectedEquip.attackSpeed && selectedEquip.attackSpeed > 0 && (
                  <div className="flex justify-between">
                    <span style={{ ...neonText, fontSize: '8px', color: '#00F5D4' }}>攻击速度</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                      +{selectedEquip.attackSpeed}%
                    </span>
                  </div>
                )}
                {selectedEquip.critRate && selectedEquip.critRate > 0 && (
                  <div className="flex justify-between">
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFE600' }}>暴击率</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                      +{selectedEquip.critRate}%
                    </span>
                  </div>
                )}
                {selectedEquip.critDamage && selectedEquip.critDamage > 0 && (
                  <div className="flex justify-between">
                    <span style={{ ...neonText, fontSize: '8px', color: '#FF0080' }}>暴击伤害</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                      +{selectedEquip.critDamage}%
                    </span>
                  </div>
                )}
                {selectedEquip.defense && selectedEquip.defense > 0 && (
                  <div className="flex justify-between">
                    <span style={{ ...neonText, fontSize: '8px', color: '#5DADE2' }}>防御</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                      +{selectedEquip.defense}
                    </span>
                  </div>
                )}
                {selectedEquip.maxDurability && (
                  <div className="flex justify-between pt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.1)' }}>
                    <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>耐久度</span>
                    <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>
                      {selectedEquip.maxDurability}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>等级</span>
                  <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>
                    Lv.{selectedEquip.level}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {selectedAchievement && (
        <div
          className="absolute inset-0 bg-black/70 flex items-center justify-center z-20"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={closeModal}
        >
          <div
            className="relative w-72 p-4"
            style={{
              background: 'rgba(19, 16, 37, 0.95)',
              border: `1px solid ${selectedAchievement.unlocked ? 'rgba(255, 230, 0, 0.4)' : 'rgba(176, 38, 255, 0.4)'}`,
              borderRadius: '14px',
              boxShadow: selectedAchievement.unlocked
                ? `0 0 30px ${neonYellow}30`
                : `0 0 30px ${neonPurple}25`,
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />
            <div className="relative" style={{ zIndex: 1 }}>
            <button
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center"
              style={{
                background: 'rgba(255, 45, 85, 0.15)',
                border: '1px solid rgba(255, 45, 85, 0.3)',
                borderRadius: '6px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '11px',
                fontWeight: 700,
                color: '#FF2D55',
                cursor: 'pointer',
              }}
              onClick={closeModal}
            >
              ×
            </button>

            <div className="flex items-center gap-3 mb-3 pr-8">
              <div
                className="w-14 h-14 flex items-center justify-center"
                style={{
                  background: selectedAchievement.unlocked
                    ? 'rgba(255, 230, 0, 0.1)'
                    : 'rgba(176, 38, 255, 0.1)',
                  border: `1.5px solid ${selectedAchievement.unlocked ? neonYellow : neonPurple}`,
                  borderRadius: '10px',
                  boxShadow: selectedAchievement.unlocked
                    ? `0 0 12px ${neonYellow}40`
                    : `0 0 12px ${neonPurple}30`,
                }}
              >
                <span className="text-3xl" style={{ filter: selectedAchievement.unlocked ? `drop-shadow(0 0 6px ${neonYellow}60)` : 'none' }}>
                  {selectedAchievement.icon}
                </span>
              </div>
              <div>
                <div
                  style={{
                    ...neonText,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: selectedAchievement.unlocked ? neonYellow : '#B0A8C8',
                    textShadow: selectedAchievement.unlocked ? `0 0 6px ${neonYellow}50` : 'none',
                  }}
                >
                  {selectedAchievement.name}
                </div>
                <div className="mt-1" style={{ ...neonText, fontSize: '8px', color: selectedAchievement.claimed ? '#80C080' : selectedAchievement.unlocked ? '#FFE066' : '#5A5A7A' }}>
                  {selectedAchievement.claimed ? '已领取' : selectedAchievement.unlocked ? '可领取' : '未达成'}
                </div>
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
              <p className="mb-3" style={{ ...neonText, fontSize: '8px', color: '#B0A8C8', lineHeight: '1.6' }}>
                {selectedAchievement.description}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: neonPurple }}>进度</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                    {selectedAchievement.progress} / {selectedAchievement.target}
                  </span>
                </div>
                <div className="w-full h-2" style={{ background: 'rgba(100, 100, 130, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (selectedAchievement.progress / selectedAchievement.target) * 100)}%`,
                      background: selectedAchievement.unlocked ? neonYellow : neonPurple,
                      borderRadius: '4px',
                      boxShadow: selectedAchievement.unlocked ? `0 0 8px ${neonYellow}60` : `0 0 8px ${neonPurple}40`,
                    }}
                  />
                </div>
                <div className="flex justify-between pt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.1)' }}>
                  <span style={{ ...neonText, fontSize: '8px', color: neonCyan }}>奖励</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF', fontWeight: 600 }}>
                    {selectedAchievement.reward}
                  </span>
                </div>
              </div>

              {/* 领取按钮 */}
              {selectedAchievement.unlocked && !selectedAchievement.claimed && (
                <button
                  className="w-full mt-3"
                  style={{
                    padding: '8px 0',
                    background: `linear-gradient(180deg, ${hexToRgba(neonYellow, 0.3)} 0%, ${hexToRgba(neonYellow, 0.15)} 100%)`,
                    border: `1px solid ${hexToRgba(neonYellow, 0.6)}`,
                    borderRadius: '8px',
                    ...neonText,
                    fontSize: '10px',
                    fontWeight: 700,
                    color: neonYellow,
                    cursor: 'pointer',
                    boxShadow: `0 0 12px ${hexToRgba(neonYellow, 0.3)}`,
                    textShadow: `0 0 6px ${hexToRgba(neonYellow, 0.5)}`,
                  }}
                  onClick={(e) => {
                    handleClaim(selectedAchievement.id, e);
                    closeModal();
                  }}
                >
                  领取奖励
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 性能优化：memo 包装
export const CodexPanel = memo(CodexPanelImpl);
