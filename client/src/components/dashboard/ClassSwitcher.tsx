import React from 'react';
import { Zap } from 'lucide-react';
import { CLASSES } from 'shared';

interface ClassSwitcherProps {
  character: any;
  onSelectClass: (className: string) => void;
}

export const ClassSwitcher: React.FC<ClassSwitcherProps> = ({
  character,
  onSelectClass
}) => {
  return (
    <div className="glass-panel p-6 border-white/5 bg-[#090e1a]/95 flex flex-col gap-4 shadow-lg">
      <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider text-neon-magenta flex items-center gap-1.5">
        <Zap className="w-4 h-4 shrink-0" />
        Switch Active Class
      </h3>
      <p className="text-[10px] text-slate-400 leading-relaxed m-0 mb-2">
        Instantly toggle between profiles. Progress, level stats, and equipped items are saved separately.
      </p>

      <div className="flex flex-col gap-2">
        {Object.entries(CLASSES).map(([key, config]) => {
          const isActive = character.class === key;
          const classChar = character.user.characters?.find((c: any) => c.class === key);
          const charLvlStr = classChar ? `Lvl ${classChar.level}` : '[NEW]';

          return (
            <button
              key={key}
              onClick={() => !isActive && onSelectClass(key)}
              disabled={isActive}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-display flex items-center justify-between border transition duration-300 ${
                isActive
                  ? 'bg-white/5 border-white/10 text-white cursor-default'
                  : 'bg-black/20 hover:bg-black/50 border-white/5 hover:border-white/20 text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                <span className={isActive ? 'font-bold' : ''}>{config.name}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">{charLvlStr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
