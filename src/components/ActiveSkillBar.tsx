import { useEffect, useState, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ActiveSkill } from '../game/types/game';

interface EngineRef {
  current: {
    useActiveSkill: (skillId: string) => boolean;
    getActiveSkills: () => ActiveSkill[];
  } | null;
}

interface ActiveSkillBarProps {
  engineRef: EngineRef;
}

function ActiveSkillBarImpl({ engineRef }: ActiveSkillBarProps) {
  // 性能优化：使用细粒度 selector
  const activeSkills = useGameStore(s => s.activeSkills);
  const [skills, setSkills] = useState<ActiveSkill[]>([]);

  useEffect(() => {
    if (activeSkills.length > 0) {
      setSkills(activeSkills);
    }
  }, [activeSkills]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current) {
        setSkills([...engineRef.current.getActiveSkills()]);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [engineRef]);

  const handleSkillClick = (skillId: string) => {
    if (engineRef.current) {
      engineRef.current.useActiveSkill(skillId);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
      {skills.map((skill) => {
        const cdPercent = skill.currentCooldown / skill.cooldown;
        const isReady = skill.currentCooldown <= 0;
        
        return (
          <div
            key={skill.id}
            className={`relative w-14 h-14 cursor-pointer select-none ${
              isReady ? 'hover:scale-110' : 'opacity-70'
            } transition-transform`}
            style={{
              background: 'linear-gradient(180deg, #5D4037 0%, #3D2914 100%)',
              border: '3px solid #8B4513',
              boxShadow: 'inset 2px 2px 0 #8B6914, inset -2px -2px 0 #2D1F0E, 3px 3px 0 #1A0F05',
            }}
            onClick={() => isReady && handleSkillClick(skill.id)}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-2xl">{skill.icon}</span>
              <span 
                className="text-[8px] text-[#FFE066]"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {skill.key}
              </span>
            </div>

            {!isReady && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-black/60"
                style={{ height: `${cdPercent * 100}%` }}
              />
            )}

            {!isReady && (
              <span 
                className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ 
                  fontFamily: '"Press Start 2P", monospace',
                  textShadow: '1px 1px 0 #000',
                  fontSize: '10px',
                }}
              >
                {(skill.currentCooldown / 1000).toFixed(1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 性能优化：memo 包装
export const ActiveSkillBar = memo(ActiveSkillBarImpl);
