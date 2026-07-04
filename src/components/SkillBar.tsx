import { useGameStore } from '../store/gameStore';

interface GameEngineRef {
  current: {
    useSkill: (skillId: string) => boolean;
  } | null;
}

interface SkillBarProps {
  engineRef: GameEngineRef;
}

export function SkillBar({ engineRef }: SkillBarProps) {
  const { skills } = useGameStore();

  const handleUseSkill = (skillId: string) => {
    if (engineRef.current) {
      engineRef.current.useSkill(skillId);
    }
  };

  return (
    <div className="bg-[#654321] border-2 border-[#3D2914]" style={{ boxShadow: '4px 4px 0 #3D2914' }}>
      <div className="p-3 border-b-2 border-[#3D2914] bg-[#5D4037]">
        <h3 className="text-[#FFD700] font-bold text-xs flex items-center gap-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          <span>✨</span>
          <span>SKILLS</span>
        </h3>
      </div>
      <div className="p-3 flex gap-2">
        {skills.map((skill, index) => {
          const isOnCooldown = skill.currentCooldown > 0;
          const cooldownPercent = isOnCooldown
            ? (skill.currentCooldown / skill.cooldown) * 100
            : 0;
          const cooldownTime = Math.ceil(skill.currentCooldown / 1000);

          return (
            <div
              key={skill.id}
              className={`w-12 h-12 border-2 flex items-center justify-center relative overflow-hidden ${
                isOnCooldown
                  ? 'border-[#3D2914] bg-[#4A3728]'
                  : 'border-[#9932CC] bg-[#8A2BE2] cursor-pointer hover:border-[#DDA0DD]'
              }`}
              style={{ 
                boxShadow: '2px 2px 0 #3D2914',
                transition: 'all 0.1s'
              }}
              onClick={() => !isOnCooldown && handleUseSkill(skill.id)}
              title={`${skill.name}: ${skill.description}`}
            >
              <span className="text-xl relative z-10">{skill.icon}</span>

              {isOnCooldown && (
                <>
                  <div
                    className="absolute inset-0 bg-[#3D2914]"
                    style={{
                      clipPath: `inset(0 0 ${100 - cooldownPercent}% 0)`,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[#FFD700] font-bold text-xs z-20" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                    {cooldownTime}s
                  </span>
                </>
              )}

              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-[#DEB887]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px' }}>
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
