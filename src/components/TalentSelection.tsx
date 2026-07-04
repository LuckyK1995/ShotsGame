import { useGameStore } from '../store/gameStore';
import type { Talent } from '../game/types/game';

interface EngineRef {
  current: {
    selectTalent: (talentId: string) => boolean;
    resume: () => void;
  } | null;
}

interface TalentSelectionProps {
  engineRef: EngineRef;
}

export function TalentSelection({ engineRef }: TalentSelectionProps) {
  const { showTalentSelection, talentChoices, setShowTalentSelection } = useGameStore();

  if (!showTalentSelection || talentChoices.length === 0) return null;

  const handleSelect = (talent: Talent) => {
    if (engineRef.current) {
      engineRef.current.selectTalent(talent.id);
      engineRef.current.resume();
      setShowTalentSelection(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9A9A9A';
      case 'rare': return '#5BA3E0';
      case 'legendary': return '#E08030';
      default: return '#9A9A9A';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'linear-gradient(180deg, #6A6A6A 0%, #4A4A4A 100%)';
      case 'rare': return 'linear-gradient(180deg, #4A7BA0 0%, #2D5A80 100%)';
      case 'legendary': return 'linear-gradient(180deg, #C07020 0%, #8B4513 100%)';
      default: return 'linear-gradient(180deg, #6A6A6A 0%, #4A4A4A 100%)';
    }
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="text-center max-w-4xl px-4">
        <h2
          className="text-3xl mb-2 text-[#FFD700]"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '3px 3px 0 #3D2914',
          }}
        >
          LEVEL UP!
        </h2>
        <p
          className="mb-8 text-[#DEB887] text-sm"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CHOOSE A TALENT
        </p>

        <div className="flex gap-6 justify-center flex-wrap">
          {talentChoices.map((talent) => (
            <div
              key={talent.id}
              className="w-56 p-5 cursor-pointer hover:scale-105 transition-transform"
              style={{
                background: getRarityBg(talent.rarity),
                border: `4px solid ${getRarityColor(talent.rarity)}`,
                boxShadow: `inset 3px 3px 0 rgba(255,255,255,0.2), inset -3px -3px 0 rgba(0,0,0,0.3), 6px 6px 0 #1A0F05`,
              }}
              onClick={() => handleSelect(talent)}
            >
              <div className="text-5xl mb-4">{talent.icon}</div>

              <h3
                className="text-sm mb-3"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  color: getRarityColor(talent.rarity),
                  textShadow: '2px 2px 0 #1A0F05',
                }}
              >
                {talent.name}
              </h3>

              <p
                className="text-xs leading-relaxed"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  color: '#FFE4B5',
                  fontSize: '8px',
                  lineHeight: '1.8',
                }}
              >
                {talent.description}
              </p>

              <div
                className="mt-4 text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  color: getRarityColor(talent.rarity),
                }}
              >
                {talent.rarity === 'legendary' ? 'LEGENDARY' :
                 talent.rarity === 'rare' ? 'RARE' : 'COMMON'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
