import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getItemDef, RARITY_COLORS } from '../game/data/equipment';
import { itemSlotStyle, emptySlotStyle, hexToRgba } from './InventoryPanel';
import type { ItemRarity, ItemStack, Skill } from '../game/types/game';

interface EngineRefShape {
  current: {
    useItem: (itemId: string) => void;
    useSkill: (skillId: string) => boolean;
    getItemCooldowns: () => { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[];
  } | null;
}

interface QuickBarsProps {
  engineRef: EngineRefShape;
}

const neonCyan = '#00F5D4';
const neonPurple = '#B026FF';
const neonBlue = '#4FACFE';

const neonText: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

// 与 InventoryPanel 保持一致的格子尺寸（36x36，gap 4）
const CELL = 36;
const CELL_GAP = 4;

// 主动技能判定：cooldown > 0 即为主动技能（被动技能 cooldown = 0）
const isActiveSkill = (skill: Skill): boolean => skill.cooldown > 0;

// 已学习技能的格子样式：使用 epic 级蓝色发光风格
const skillActiveStyle = {
  background: 'radial-gradient(circle at 50% 40%, #2A3A6A 0%, #1A2A50 55%, #101830 100%)',
  border: `2.5px solid ${hexToRgba(neonBlue, 0.6)}`,
  borderRadius: '8px',
  boxShadow: `0 0 12px ${hexToRgba(neonBlue, 0.35)}`,
} as React.CSSProperties;

export function QuickBars({ engineRef }: QuickBarsProps) {
  const potionHotbar = useGameStore(s => s.potionHotbar);
  const skills = useGameStore(s => s.skills);
  const [itemCds, setItemCds] = useState<Record<string, { remaining: number; duration: number }>>({});

  // 轮询物品冷却（技能冷却已通过 skills store 响应式更新，无需轮询）
  useEffect(() => {
    const update = () => {
      const eng = engineRef.current;
      if (!eng) return;
      const cds = eng.getItemCooldowns();
      const map: Record<string, { remaining: number; duration: number }> = {};
      for (const cd of cds) {
        map[cd.key] = { remaining: cd.remaining, duration: cd.duration };
      }
      setItemCds(map);
    };
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [engineRef]);

  const handleItemClick = (stack: ItemStack | null) => {
    if (!stack) return;
    const itemDef = getItemDef(stack.itemId);
    if (!itemDef || itemDef.type !== 'consumable') return;
    engineRef.current?.useItem(stack.itemId);
  };

  const handleSkillClick = (skill: Skill) => {
    if (skill.level <= 0 || skill.currentCooldown > 0) return;
    engineRef.current?.useSkill(skill.id);
  };

  // 物品格子（8 格，2行4列）
  const itemCells = potionHotbar;
  // 技能格子（8 格，2行4列）：已学习（level > 0）的主动技能，按 cooldown 大小排序
  const learnedActiveSkills = skills
    .filter(s => s.level > 0 && isActiveSkill(s))
    .sort((a, b) => a.cooldown - b.cooldown);
  const skillCells: (Skill | null)[] = [];
  for (let i = 0; i < 8; i++) {
    skillCells.push(learnedActiveSkills[i] || null);
  }

  const renderGrid = (cells: React.ReactNode[]) => (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(4, ${CELL}px)`,
        gridTemplateRows: `repeat(2, ${CELL}px)`,
        gap: CELL_GAP,
      }}
    >
      {cells}
    </div>
  );

  return (
    <div
      className="flex items-center justify-center gap-3 h-full"
      style={{ padding: '0 6px' }}
    >
      {/* 物品快捷栏 */}
      <div className="flex flex-col items-start gap-1">
        <div
          style={{
            ...neonText,
            fontSize: '8px',
            color: neonCyan,
            letterSpacing: '1px',
            paddingLeft: '2px',
          }}
        >
          快捷使用
        </div>
        {renderGrid(
          itemCells.map((stack, idx) => {
            const itemDef = stack ? getItemDef(stack.itemId) : null;
            const rarity = itemDef?.rarity as ItemRarity | undefined;
            const cd = itemDef?.effect ? itemCds[itemDef.effect] : null;
            const isOnCooldown = !!cd && cd.remaining > 0;
            const cdPercent = cd ? 1 - cd.remaining / cd.duration : 0;
            const cdText = cd ? `${(cd.remaining / 1000).toFixed(1)}` : '';
            return (
              <div
                key={`item-${idx}`}
                onClick={() => handleItemClick(stack)}
                title={itemDef ? `${itemDef.name} (点击使用)` : '空位'}
                className="flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
                style={{
                  width: CELL,
                  height: CELL,
                  ...(stack ? itemSlotStyle(rarity) : emptySlotStyle),
                }}
              >
                {itemDef && (
                  <span
                    className="text-base relative"
                    style={{
                      filter: isOnCooldown
                        ? `grayscale(${1 - cdPercent}) brightness(${0.4 + cdPercent * 0.6}) drop-shadow(0 0 4px rgba(255,255,255,0.2))`
                        : 'drop-shadow(0 0 4px rgba(255,255,255,0.35))',
                      zIndex: 2,
                    }}
                  >
                    {itemDef.icon}
                  </span>
                )}
                {stack && stack.count > 1 && (
                  <span
                    className="absolute bottom-0.5 right-0.5 text-[7px] px-1"
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      color: '#0D0B1A',
                      backgroundColor: isOnCooldown ? '#8B80A0' : neonCyan,
                      borderRadius: '3px',
                      fontWeight: 700,
                      zIndex: 3,
                    }}
                  >
                    {stack.count}
                  </span>
                )}
                {isOnCooldown && (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `conic-gradient(rgba(0,0,0,0.4) ${cdPercent * 360}deg, transparent 0deg)`,
                        zIndex: 1,
                      }}
                    />
                    <span
                      className="absolute"
                      style={{
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        fontSize: '7px',
                        color: '#FFFFFF',
                        textShadow: '0 0 2px rgba(0,0,0,0.9)',
                        zIndex: 3,
                        lineHeight: 1,
                      }}
                    >
                      {cdText}
                    </span>
                  </>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* 分隔线 */}
      <div
        style={{
          width: '1px',
          alignSelf: 'stretch',
          margin: '8px 0',
          background: `linear-gradient(180deg, transparent 0%, ${neonPurple}50 50%, transparent 100%)`,
        }}
      />

      {/* 技能快捷栏：仅显示已学习的主动技能 */}
      <div className="flex flex-col items-start gap-1">
        <div
          style={{
            ...neonText,
            fontSize: '8px',
            color: neonBlue,
            letterSpacing: '1px',
            paddingLeft: '2px',
          }}
        >
          主动技能
        </div>
        {renderGrid(
          skillCells.map((skill, idx) => {
            const isOnCooldown = !!skill && skill.currentCooldown > 0;
            const cdPercent = skill && skill.cooldown > 0
              ? 1 - skill.currentCooldown / skill.cooldown
              : 0;
            const cdText = skill ? `${Math.ceil(skill.currentCooldown / 1000)}` : '';
            return (
              <div
                key={`skill-${idx}`}
                onClick={() => skill && handleSkillClick(skill)}
                title={skill ? `${skill.name} (Lv.${skill.level}/${skill.maxLevel})` : '空位'}
                className={`flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                  skill ? '' : 'cursor-default'
                }`}
                style={{
                  width: CELL,
                  height: CELL,
                  ...(skill ? skillActiveStyle : emptySlotStyle),
                }}
              >
                {skill && (
                  <span
                    className="text-base relative"
                    style={{
                      filter: isOnCooldown
                        ? `grayscale(${1 - cdPercent}) brightness(${0.4 + cdPercent * 0.6}) drop-shadow(0 0 4px ${hexToRgba(neonBlue, 0.5)})`
                        : `drop-shadow(0 0 4px ${hexToRgba(neonBlue, 0.6)})`,
                      zIndex: 2,
                    }}
                  >
                    {skill.icon}
                  </span>
                )}
                {isOnCooldown && (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `conic-gradient(rgba(0,0,0,0.4) ${cdPercent * 360}deg, transparent 0deg)`,
                        zIndex: 1,
                      }}
                    />
                    <span
                      className="absolute"
                      style={{
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        fontSize: '7px',
                        color: '#FFFFFF',
                        textShadow: '0 0 2px rgba(0,0,0,0.9)',
                        zIndex: 3,
                        lineHeight: 1,
                      }}
                    >
                      {cdText}
                    </span>
                  </>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
