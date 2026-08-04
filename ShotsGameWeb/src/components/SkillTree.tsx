import { useGameStore } from '../store/gameStore';
import { SKILLS } from '../game/data/equipment';
import type { Skill } from '../game/types/game';
import { useMemo, useState, memo } from 'react';
import { neonCyan, neonPurple, neonPink, neonYellow } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

interface GameEngineRef {
  current: {
    upgradeSkill: (skillId: string) => boolean;
    downgradeSkill: (skillId: string) => boolean;
    useSkill: (skillId: string) => boolean;
    resetSkills: () => void;
  } | null;
}

interface SkillTreeProps {
  engineRef: GameEngineRef;
}

// neonCyan/neonPurple/neonPink/neonYellow 已移至 theme/colors（共享版本）

const cardStyle = {
  background: 'rgba(19, 16, 37, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(176, 38, 255, 0.25)',
  borderRadius: '12px',
  boxShadow: '0 0 20px rgba(176, 38, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
};

function SkillTreeImpl({ engineRef }: SkillTreeProps) {
  // 性能优化：使用细粒度 selector
  const skills = useGameStore(s => s.skills);
  const player = useGameStore(s => s.player);
  const isRunning = useGameStore(s => s.gameState?.isRunning ?? false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'fx' | 'clone'>('stats');

  const skillMap = useMemo(() => {
    const map = new Map<string, Skill>();
    for (const s of skills) {
      map.set(s.id, s);
    }
    return map;
  }, [skills]);

  const skillDefMap = useMemo(() => {
    const map = new Map<string, Skill>();
    for (const s of SKILLS) {
      map.set(s.id, s);
    }
    return map;
  }, []);

  const canUpgrade = (skillId: string): boolean => {
    const skill = skillMap.get(skillId);
    if (!skill || !player) return false;
    if (skill.level >= skill.maxLevel) return false;
    if (player.skillPoints < skill.cost) return false;
    if (player.level < skill.requiredLevel) return false;
    if (skill.requiredSkills) {
      for (const reqId of skill.requiredSkills) {
        const reqSkill = skillMap.get(reqId);
        if (!reqSkill || reqSkill.level === 0) return false;
      }
    }
    return true;
  };

  const canDowngrade = (skillId: string): boolean => {
    const skill = skillMap.get(skillId);
    if (!skill) return false;
    if (skill.level <= 0) return false;
    for (const other of skills) {
      if (other.id === skillId) continue;
      if (other.requiredSkills?.includes(skillId) && other.level > 0) {
        return false;
      }
    }
    return true;
  };

  const hasPrereqs = (skillId: string): boolean => {
    const skill = skillMap.get(skillId);
    if (!skill?.requiredSkills) return true;
    return skill.requiredSkills.every(reqId => {
      const reqSkill = skillMap.get(reqId);
      return reqSkill && reqSkill.level > 0;
    });
  };

  const getMissingPrereqName = (skillId: string): string | null => {
    const skill = skillMap.get(skillId) || skillDefMap.get(skillId);
    if (!skill?.requiredSkills) return null;
    for (const reqId of skill.requiredSkills) {
      const reqSkill = skillMap.get(reqId) || skillDefMap.get(reqId);
      if (!reqSkill || reqSkill.level === 0) {
        return reqSkill?.name || '未知技能';
      }
    }
    return null;
  };

  const handleUpgrade = (skillId: string) => {
    if (engineRef.current && canUpgrade(skillId)) {
      engineRef.current.upgradeSkill(skillId);
    }
  };

  const handleDowngrade = (skillId: string) => {
    if (engineRef.current && canDowngrade(skillId)) {
      engineRef.current.downgradeSkill(skillId);
    }
  };

  const handleUseSkill = (skillId: string) => {
    if (engineRef.current) {
      engineRef.current.useSkill(skillId);
    }
  };

  const isActiveSkill = (skillId: string): boolean => {
    return skillId.startsWith('multishot_') || skillId.startsWith('laser_') ||
           skillId.startsWith('shield_') || skillId.startsWith('nuke_') ||
           skillId === 'fx_laser_1' || skillId === 'fx_flash_1' || skillId === 'clone_sweep' ||
           skillId === 'fx_freeze_1' || skillId === 'fx_bomb_1' || skillId === 'fx_poison_1' || skillId === 'fx_shock_1' ||
           skillId === 'fx_nuke_1';
  };

  const neonText = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 600,
    letterSpacing: '0.5px',
  } as React.CSSProperties;

  const selectedSkill = selectedSkillId ? (skillMap.get(selectedSkillId) || skillDefMap.get(selectedSkillId)) : null;

  // 渲染单棵树：按 requiredLevel 动态分组，等级一致的技能放同一行
  const renderTree = (skillIds: readonly string[], accentColor: string) => {
    const levelGroups = new Map<number, string[]>();
    for (const id of skillIds) {
      const def = skillDefMap.get(id);
      if (!def) continue;
      const lvl = def.requiredLevel;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(id);
    }
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    return (
    <div className="space-y-2 pb-4">
      {sortedLevels.map((reqLevel, layerIdx) => {
        const layer = levelGroups.get(reqLevel)!;
        return (
        <div key={layerIdx} className="relative">
          <div className="flex items-center gap-1">
            <span
              className="flex-shrink-0"
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '9px',
                color: accentColor,
                fontWeight: 700,
                letterSpacing: '0.3px',
                textShadow: `0 0 4px ${accentColor}40`,
                minWidth: '22px',
              }}
            >
              Lv.{reqLevel}
            </span>
            <div className="flex-1 flex justify-center gap-1.5 flex-wrap">
            {layer.map((skillId) => {
              const skill = skillMap.get(skillId) || skillDefMap.get(skillId);
              if (!skill) return null;

              const upgradeable = canUpgrade(skillId);
              const downgradeable = canDowngrade(skillId);
              const hasReq = hasPrereqs(skillId);
              const learned = skill.level > 0;
              const isActive = isActiveSkill(skillId);
              const onCooldown = skill.currentCooldown > 0;

              const borderColor = learned
                ? accentColor
                : hasReq
                  ? 'rgba(176, 38, 255, 0.4)'
                  : 'rgba(100, 100, 130, 0.2)';
              const bgColor = learned
                ? `${accentColor}1A`
                : hasReq
                  ? 'rgba(19, 16, 37, 0.6)'
                  : 'rgba(19, 16, 37, 0.3)';
              const glow = learned
                ? `0 0 8px ${accentColor}30`
                : hasReq
                  ? `0 0 6px ${neonPurple}20`
                  : 'none';
              const textColor = learned ? accentColor : hasReq ? '#B0A8C8' : '#5A5A7A';

              return (
                <div
                  key={skillId}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setSelectedSkillId(skillId)}
                >
                  <div
                    className="relative w-11 h-11 border flex flex-col items-center justify-center transition-all"
                    style={{
                      background: bgColor,
                      border: `2.5px solid ${borderColor}`,
                      borderRadius: '10px',
                      boxShadow: glow,
                      backdropFilter: 'blur(4px)',
                      opacity: hasReq ? 1 : 0.5,
                    }}
                  >
                    <span className="text-lg" style={{ filter: learned ? `drop-shadow(0 0 4px ${accentColor}60)` : 'none' }}>
                      {skill.icon}
                    </span>
                    <span
                      className="text-[6px] mt-0.5"
                      style={{
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        fontWeight: 600,
                        color: textColor,
                      }}
                    >
                      {skill.level}/{skill.maxLevel}
                    </span>
                    {onCooldown && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-[10px]">
                        <span className="text-white text-[8px]" style={{ fontFamily: '"Rajdhani", monospace', fontWeight: 700 }}>
                          {Math.ceil(skill.currentCooldown / 1000)}s
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="text-[6px] mt-1 text-center max-w-11 truncate"
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontWeight: 500,
                      color: textColor,
                    }}
                  >
                    {skill.name}
                  </div>
                  <div
                    className="text-[5px] mt-0.5"
                    style={{
                      fontFamily: '"Rajdhani", monospace',
                      color: upgradeable ? neonYellow : (learned && downgradeable) ? neonPink : '#5A5A7A',
                      fontWeight: 600,
                    }}
                  >
                    {skill.level < skill.maxLevel ? `${skill.cost}点` : '满级'}
                  </div>
                  {isActive && (
                    <span
                      className="text-[5px]"
                      style={{ fontFamily: '"Rajdhani", monospace', color: onCooldown ? '#5A5A7A' : neonCyan, fontWeight: 600 }}
                    >
                      {onCooldown ? '冷却' : '主动'}
                    </span>
                  )}
                </div>
              );
            })}
            </div>
          </div>
          {layerIdx < sortedLevels.length - 1 && (
            <div className="flex justify-center my-0.5">
              <span style={{ color: 'rgba(176, 38, 255, 0.4)', fontSize: '8px' }}>↓</span>
            </div>
          )}
        </div>
        );
      })}
    </div>
    );
  };

  const tabs: { id: string; label: string; color: string; skillIds: string[] }[] = [
    { id: 'stats', label: '属性技能', color: neonCyan, skillIds: ['atk', 'spd', 'hp', 'crit', 'def', 'cdmg', 'regen', 'lifesteal', 'piercing'] },
    { id: 'fx', label: '特效技能', color: neonPink, skillIds: ['fx_bullet_1', 'fx_sync_1', 'fx_bomb_1', 'fx_freeze_1', 'fx_poison_1', 'fx_shock_1', 'fx_laser_1', 'fx_grenade_1', 'fx_flash_1', 'fx_nuke_1'] },
    { id: 'clone', label: '分身战术', color: neonYellow, skillIds: ['clone_1', 'clone_bullet_1', 'clone_sync_1', 'fx_clone_grenade_1', 'fx_clone_shock_1', 'clone_sweep'] },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="h-full p-2 flex flex-col relative" style={{ color: '#E0E0FF' }}>
      <div className="flex justify-between items-center mb-2">
        <span style={{ ...neonText, fontSize: '10px', color: neonCyan, letterSpacing: '1px' }}>
          技能树
        </span>
        <span style={{ ...neonText, fontSize: '9px', color: neonPurple }}>
          技能点 {player?.skillPoints || 0}
        </span>
      </div>

      {/* 页签栏 */}
      <div className="flex gap-1 mb-2">
        {tabs.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              className="flex-1 py-1.5"
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '9px',
                fontWeight: 700,
                color: active ? tab.color : '#8B80A0',
                background: active ? `${tab.color}1A` : 'rgba(19, 16, 37, 0.5)',
                border: `1px solid ${active ? `${tab.color}80` : 'rgba(100, 100, 130, 0.2)'}`,
                borderRadius: '6px',
                letterSpacing: '1px',
                boxShadow: active ? `0 0 8px ${tab.color}20` : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setActiveTab(tab.id as 'stats' | 'fx' | 'clone')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderTree(activeTabData.skillIds, activeTabData.color)}
      </div>

      <div className="flex justify-end gap-2 mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
        <button
          style={{
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '8px',
            fontWeight: 600,
            color: '#FF2D55',
            background: 'rgba(255, 45, 85, 0.1)',
            border: '1px solid rgba(255, 45, 85, 0.25)',
            borderRadius: '6px',
            padding: '4px 10px',
            minWidth: '60px',
            boxShadow: '0 0 6px rgba(255, 45, 85, 0.1)',
            cursor: 'pointer',
          }}
          onClick={() => setShowResetConfirm(true)}
        >
          重置技能
        </button>
      </div>

      {showResetConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-56 p-4"
            style={{
              ...cardStyle,
              padding: '14px 16px',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHudBackground accentColor={neonCyan} accentColor2={neonPurple} />
            <div className="relative" style={{ zIndex: 1 }}>
            <div
              className="text-center mb-3"
              style={{ ...neonText, fontSize: '10px', color: neonYellow, fontWeight: 700 }}
            >
              确认重置技能？
            </div>
            <div
              className="text-center mb-4"
              style={{ ...neonText, fontSize: '7px', color: '#B0A8C8', lineHeight: '1.5' }}
            >
              将重置所有技能等级
              <br />
              并返还全部技能点
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-1.5"
                style={{
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '8px',
                  fontWeight: 600,
                  color: '#8B80A0',
                  background: 'rgba(100, 100, 130, 0.1)',
                  border: '1px solid rgba(100, 100, 130, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setShowResetConfirm(false)}
              >
                取消
              </button>
              <button
                className="flex-1 py-1.5"
                style={{
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '8px',
                  fontWeight: 700,
                  color: '#FF2D55',
                  background: 'rgba(255, 45, 85, 0.15)',
                  border: '1px solid rgba(255, 45, 85, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 8px rgba(255, 45, 85, 0.15)',
                }}
                onClick={() => {
                  if (engineRef.current?.resetSkills) {
                    engineRef.current.resetSkills();
                  }
                  setShowResetConfirm(false);
                }}
              >
                确认重置
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {selectedSkill && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedSkillId(null)}
        >
          <div
            className="relative w-64 p-4"
            style={{
              ...cardStyle,
              padding: '16px 18px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHudBackground accentColor={neonCyan} accentColor2={neonPurple} />
            <div className="relative" style={{ zIndex: 1 }}>
            <button
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center"
              style={{
                background: 'rgba(255, 45, 85, 0.2)',
                border: '1px solid rgba(255, 45, 85, 0.4)',
                borderRadius: '6px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#FF2D55',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedSkillId(null)}
            >
              X
            </button>

            <div className="flex items-center gap-3 mb-3 pr-8">
              <div
                className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                style={{
                  background: selectedSkill.level > 0
                    ? 'rgba(0, 245, 212, 0.1)'
                    : 'rgba(19, 16, 37, 0.6)',
                  border: `2.5px solid ${selectedSkill.level > 0 ? neonCyan : 'rgba(176, 38, 255, 0.4)'}`,
                  borderRadius: '8px',
                  boxShadow: selectedSkill.level > 0 ? `0 0 8px ${neonCyan}30` : 'none',
                }}
              >
                <span className="text-2xl" style={{ filter: selectedSkill.level > 0 ? `drop-shadow(0 0 4px ${neonCyan}60)` : 'none' }}>
                  {selectedSkill.icon}
                </span>
              </div>
              <div className="min-w-0">
                <div
                  style={{
                    ...neonText,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: selectedSkill.level > 0 ? neonCyan : neonPurple,
                    textShadow: selectedSkill.level > 0 ? `0 0 6px ${neonCyan}60` : `0 0 6px ${neonPurple}40`,
                  }}
                >
                  {selectedSkill.name}
                </div>
                <div
                  className="mt-1"
                  style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}
                >
                  等级 {selectedSkill.level}/{selectedSkill.maxLevel}
                </div>
              </div>
            </div>

            <div
              className="pt-2 mb-3"
              style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}
            >
              <p style={{ ...neonText, fontSize: '8px', color: '#B0A8C8', lineHeight: '1.5' }}>
                {selectedSkill.description}
              </p>
              <div className="mt-2 space-y-0.5">
                {selectedSkill.cooldown > 0 && (
                  <div className="flex justify-between">
                    <span style={{ ...neonText, fontSize: '8px', color: neonCyan }}>冷却</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF' }}>
                      {selectedSkill.cooldown / 1000}秒
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: neonYellow }}>消耗</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF' }}>
                    {selectedSkill.cost} 技能点
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '8px', color: neonPink }}>需要等级</span>
                  <span style={{ ...neonText, fontSize: '8px', color: '#FFFFFF' }}>
                    Lv.{selectedSkill.requiredLevel}
                  </span>
                </div>
              </div>
              {!canUpgrade(selectedSkill.id) && selectedSkill.level < selectedSkill.maxLevel && (
                <div className="mt-1.5 text-right">
                  <span style={{ ...neonText, fontSize: '7px', color: '#FF2D55' }}>
                    {player && player.skillPoints < selectedSkill.cost ? '技能点不足' :
                     player && player.level < selectedSkill.requiredLevel ? `需要 Lv.${selectedSkill.requiredLevel}` :
                     !hasPrereqs(selectedSkill.id) ? `前置技能【${getMissingPrereqName(selectedSkill.id)}】未学习` : '无法学习'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1.5"
                style={{
                  background: canDowngrade(selectedSkill.id)
                    ? 'rgba(255, 45, 85, 0.15)'
                    : 'rgba(100, 100, 130, 0.1)',
                  border: `1px solid ${canDowngrade(selectedSkill.id) ? 'rgba(255, 45, 85, 0.3)' : 'rgba(100, 100, 130, 0.2)'}`,
                  borderRadius: '6px',
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: canDowngrade(selectedSkill.id) ? '#FF2D55' : '#5A5A7A',
                  boxShadow: canDowngrade(selectedSkill.id) ? '0 0 8px rgba(255, 45, 85, 0.1)' : 'none',
                  cursor: canDowngrade(selectedSkill.id) ? 'pointer' : 'not-allowed',
                  opacity: canDowngrade(selectedSkill.id) ? 1 : 0.5,
                }}
                onClick={() => handleDowngrade(selectedSkill.id)}
                disabled={!canDowngrade(selectedSkill.id)}
              >
                回退
              </button>
              {selectedSkill.level > 0 && isActiveSkill(selectedSkill.id) && selectedSkill.currentCooldown <= 0 && (
                <button
                  className="px-4 py-1.5"
                  style={{
                    background: isRunning ? 'rgba(0, 245, 212, 0.15)' : 'rgba(100, 100, 130, 0.1)',
                    border: `1px solid ${isRunning ? 'rgba(0, 245, 212, 0.3)' : 'rgba(100, 100, 130, 0.2)'}`,
                    borderRadius: '6px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: isRunning ? neonCyan : '#5A5A7A',
                    boxShadow: isRunning ? '0 0 8px rgba(0, 245, 212, 0.1)' : 'none',
                    cursor: isRunning ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => isRunning && handleUseSkill(selectedSkill.id)}
                  disabled={!isRunning}
                >
                  释放
                </button>
              )}
              <button
                className="px-4 py-1.5"
                style={{
                  background: canUpgrade(selectedSkill.id)
                    ? 'rgba(176, 38, 255, 0.2)'
                    : 'rgba(100, 100, 130, 0.1)',
                  border: `1px solid ${canUpgrade(selectedSkill.id) ? 'rgba(176, 38, 255, 0.5)' : 'rgba(100, 100, 130, 0.2)'}`,
                  borderRadius: '6px',
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: canUpgrade(selectedSkill.id) ? neonPurple : '#5A5A7A',
                  boxShadow: canUpgrade(selectedSkill.id) ? `0 0 8px ${neonPurple}20` : 'none',
                  cursor: canUpgrade(selectedSkill.id) ? 'pointer' : 'not-allowed',
                  opacity: canUpgrade(selectedSkill.id) ? 1 : 0.5,
                }}
                onClick={() => handleUpgrade(selectedSkill.id)}
                disabled={!canUpgrade(selectedSkill.id)}
              >
                {selectedSkill.level >= selectedSkill.maxLevel ? '已满级' : '学习'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 性能优化：memo 包装
export const SkillTree = memo(SkillTreeImpl);
