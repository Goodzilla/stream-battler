import React from 'react';
import { Zap, Lock } from 'lucide-react';
import { CLASSES } from 'shared';

interface ClassSwitcherProps {
  character: any;
  onSelectClass: (className: string) => void;
}

const CLASS_UNLOCK_REQUIREMENTS: Record<string, string> = {
  VALKYRIE: 'WARRIOR',
  NECROMANCER: 'MAGE',
  MONK: 'CLERIC',
  ALCHEMIST: 'ROGUE',
  BARD: 'RANGER'
};

export const ClassSwitcher: React.FC<ClassSwitcherProps> = ({
  character,
  onSelectClass
}) => {
  return (
    <div className="glass-panel p-6 border-white/5 bg-[#090e1a]/95 flex flex-col gap-4 shadow-xl rounded-2xl relative overflow-hidden">
      {/* Visual background gradient grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

      <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider text-neon-magenta flex items-center gap-1.5 z-10">
        <Zap className="w-4 h-4 shrink-0 text-neon-magenta animate-pulse" />
        Switch Active Class
      </h3>
      <p className="text-[10px] text-slate-400 leading-relaxed m-0 mb-2 z-10">
        Instantly toggle between profiles. Progress, level stats, and equipped items are saved separately.
      </p>

      <div className="flex flex-col gap-2.5 z-10">
        {Object.entries(CLASSES).map(([key, config]) => {
          const isActive = character.class === key;
          const classChar = character.user.characters?.find((c: any) => c.class === key);
          
          // Verify lock requirement
          const requiredBaseClass = CLASS_UNLOCK_REQUIREMENTS[key];
          let isLocked = false;
          let unlockRequirementStr = '';
          if (requiredBaseClass) {
            const baseChar = character.user.characters?.find((c: any) => c.class === requiredBaseClass);
            if (!baseChar || baseChar.level < 100) {
              isLocked = true;
              const baseName = CLASSES[requiredBaseClass]?.name || requiredBaseClass;
              unlockRequirementStr = `Lvl 100 ${baseName} Req.`;
            }
          }

          let charLvlStr = '';
          if (isLocked) {
            charLvlStr = unlockRequirementStr;
          } else if (classChar) {
            charLvlStr = `Lvl ${classChar.level}`;
          } else {
            charLvlStr = 'Start Class';
          }

          return (
            <button
              key={key}
              onClick={() => !isActive && !isLocked && onSelectClass(key)}
              disabled={isActive || isLocked}
              onMouseEnter={(e) => {
                if (!isActive && !isLocked) {
                  e.currentTarget.style.borderColor = config.color;
                  e.currentTarget.style.boxShadow = `0 0 10px ${config.color}33`;
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isLocked) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-display flex items-center justify-between border transition-all duration-300 ${
                isActive
                  ? 'bg-white/5 text-white cursor-default font-bold'
                  : isLocked
                  ? 'bg-black/40 border-white/5 border-dashed text-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-black/20 border-white/5 text-slate-400'
              }`}
              style={{
                borderColor: isActive ? config.color : 'rgba(255,255,255,0.05)',
                boxShadow: isActive ? `0 0 12px ${config.color}44, inset 0 0 8px ${config.color}22` : 'none'
              }}
            >
              <span className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full shrink-0 transition-transform duration-300" 
                  style={{ 
                    backgroundColor: isLocked ? '#475569' : config.color,
                    boxShadow: !isLocked ? `0 0 8px ${config.color}` : 'none',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)'
                  }} 
                />
                <span className={isActive ? 'text-white' : ''}>{config.name}</span>
              </span>

              <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider">
                {isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                <span className={isLocked ? 'text-slate-600' : isActive ? 'text-white' : 'text-slate-500'}>
                  {charLvlStr}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
