import React from 'react';
import { TALENTS } from 'shared';

interface ClassTalentsTabProps {
  character: any;
  onSelectTalent: (talentId: string) => void;
}

export const ClassTalentsTab: React.FC<ClassTalentsTabProps> = ({
  character,
  onSelectTalent
}) => {
  const talentList = TALENTS[character.class] || {};

  return (
    <div className="glass-panel p-6 border-white/5 bg-black/25 animate-scaleUp">
      <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-4 text-neon-cyan">
        Class Talents
      </h3>
      
      <div className="flex flex-col gap-4">
        {Array.from({ length: 10 }, (_, idx) => idx + 1).map(tier => {
          const reqLevel = tier * 10;
          const isUnlocked = character.level >= reqLevel;
          const tierTalents = Object.values(talentList).filter(
            (t: any) => t.tier === tier
          );
          const selected = JSON.parse(character.talents || '[]');

          return (
            <div
              key={tier}
              className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-300 ${
                isUnlocked
                  ? 'bg-black/35 border-white/5'
                  : 'bg-black/10 border-white/5 opacity-40'
              }`}
            >
              <div>
                <span className="text-[10px] font-pixel text-slate-500 uppercase tracking-widest leading-none">
                  Tier {tier} Unlock
                </span>
                <span className="text-xs text-slate-400 font-mono ml-2">
                  (Requires Level {reqLevel})
                </span>
                <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                  Choose one capability:
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                {tierTalents.map((t: any) => {
                  const isChose = selected.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      disabled={!isUnlocked}
                      onClick={() => onSelectTalent(t.id)}
                      className={`flex-1 md:flex-initial px-4 py-2.5 rounded-lg text-xs font-display transition duration-300 ${
                        isChose
                          ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan border font-bold shadow-[0_0_10px_rgba(0,216,255,0.15)]'
                          : isUnlocked
                          ? 'bg-black/40 border-white/5 hover:border-white/20 text-slate-400 hover:text-white border'
                          : 'bg-transparent border-white/5 text-slate-600 border cursor-not-allowed'
                      }`}
                    >
                      <div className="text-left font-bold">{t.name}</div>
                      <div className="text-[9px] font-mono text-left font-normal mt-0.5 leading-normal opacity-85">
                        {t.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
