import React from 'react';

interface ItemStats {
  baseAttack: number;
  baseDefense: number;
  maxHp: number;
  attackPower: number;
  defense: number;
  critChance: number;
  atkSpeedPct: number;
  moveSpeedPct: number;
  lifesteal: number;
  reflect: number;
  cdr: number;
  fireRes: number;
  coldRes: number;
  poisonRes: number;
  physRes: number;
}

interface StatDiff {
  label: string;
  diff: number;
  isPercent: boolean;
}

const getItemStats = (item: any): ItemStats => {
  const stats: ItemStats = {
    baseAttack: item.baseAttack || 0,
    baseDefense: item.baseDefense || 0,
    maxHp: 0,
    attackPower: 0,
    defense: 0,
    critChance: 0,
    atkSpeedPct: 0,
    moveSpeedPct: 0,
    lifesteal: 0,
    reflect: 0,
    cdr: 0,
    fireRes: 0,
    coldRes: 0,
    poisonRes: 0,
    physRes: 0,
  };

  const affixesList = typeof item.affixes === 'string'
    ? JSON.parse(item.affixes || '[]')
    : item.affixes || [];

  affixesList.forEach((aff: any) => {
    if (aff.type in stats) {
      (stats as any)[aff.type] = aff.value;
    }
  });

  return stats;
};

const getStatDiffs = (hovered: ItemStats, equipped: ItemStats): StatDiff[] => {
  const diffs: StatDiff[] = [];

  const compareFlat = (label: string, hoveredVal: number, equippedVal: number) => {
    const diff = hoveredVal - equippedVal;
    if (diff !== 0) {
      diffs.push({ label, diff, isPercent: false });
    }
  };

  const comparePercent = (label: string, hoveredVal: number, equippedVal: number) => {
    const diff = hoveredVal - equippedVal;
    if (diff !== 0) {
      diffs.push({ label, diff, isPercent: true });
    }
  };

  compareFlat('Base Attack', hovered.baseAttack, equipped.baseAttack);
  compareFlat('Base Defense', hovered.baseDefense, equipped.baseDefense);
  compareFlat('MAX HP', hovered.maxHp, equipped.maxHp);
  compareFlat('ATTACK POWER', hovered.attackPower, equipped.attackPower);
  compareFlat('DEFENSE', hovered.defense, equipped.defense);
  comparePercent('CRIT CHANCE', hovered.critChance, equipped.critChance);
  comparePercent('ATTACK SPEED', hovered.atkSpeedPct, equipped.atkSpeedPct);
  comparePercent('MOVE SPEED', hovered.moveSpeedPct, equipped.moveSpeedPct);
  comparePercent('LIFESTEAL', hovered.lifesteal, equipped.lifesteal);
  comparePercent('REFLECT', hovered.reflect, equipped.reflect);
  comparePercent('CDR', hovered.cdr, equipped.cdr);
  comparePercent('FIRE RESISTANCE', hovered.fireRes, equipped.fireRes);
  comparePercent('COLD RESISTANCE', hovered.coldRes, equipped.coldRes);
  comparePercent('POISON RESISTANCE', hovered.poisonRes, equipped.poisonRes);
  comparePercent('PHYSICAL RESISTANCE', hovered.physRes, equipped.physRes);

  return diffs;
};

const formatAffix = (type: string, value: number): string => {
  let label = type.replace('Pct', '').replace('_', ' ').toUpperCase();
  if (type === 'maxHp') label = 'MAX HP';
  if (type === 'attackPower') label = 'ATTACK POWER';
  if (type === 'defense') label = 'DEFENSE';
  if (type === 'critChance') label = 'CRIT CHANCE';
  if (type === 'atkSpeedPct') label = 'ATTACK SPEED';
  if (type === 'moveSpeedPct') label = 'MOVE SPEED';
  if (type === 'lifesteal') label = 'LIFESTEAL';
  if (type === 'reflect') label = 'REFLECT';
  if (type === 'cdr') label = 'CDR';
  if (type === 'fireRes') label = 'FIRE RESISTANCE';
  if (type === 'coldRes') label = 'COLD RESISTANCE';
  if (type === 'poisonRes') label = 'POISON RESISTANCE';
  if (type === 'physRes') label = 'PHYSICAL RESISTANCE';

  const percentTypes = ['critChance', 'atkSpeedPct', 'moveSpeedPct', 'lifesteal', 'reflect', 'cdr', 'fireRes', 'coldRes', 'poisonRes', 'physRes'];
  if (percentTypes.includes(type)) {
    return `+${Math.round(value * 100)}% ${label}`;
  }
  return `+${value} ${label}`;
};

interface ItemComparisonTooltipProps {
  item: any;
  equippedItem: any | null | undefined;
}

export const ItemComparisonTooltip: React.FC<ItemComparisonTooltipProps> = ({ item, equippedItem }) => {
  const hoveredStats = getItemStats(item);
  const equippedStats = equippedItem ? getItemStats(equippedItem) : null;
  const diffs = equippedStats ? getStatDiffs(hoveredStats, equippedStats) : [];

  const renderItemCard = (targetItem: any, title?: string) => {
    const affixesList = typeof targetItem.affixes === 'string'
      ? JSON.parse(targetItem.affixes || '[]')
      : targetItem.affixes || [];

    return (
      <div className="w-[230px] flex flex-col gap-3 font-sans text-xs">
        <div>
          {title && (
            <span className="text-[8px] font-pixel text-cyan-400 block tracking-wider uppercase mb-1">
              {title}
            </span>
          )}
          <h4 className="m-0 text-white font-display text-xs font-bold leading-snug truncate">
            {targetItem.name}
          </h4>
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-0.5">
            <span>Lvl {targetItem.itemLevel} {targetItem.slot}</span>
            <span className="font-bold uppercase" style={{ color: `var(--rarity-${targetItem.rarity.toLowerCase()})` }}>
              {targetItem.rarity}
            </span>
          </div>
        </div>

        {/* Base stats */}
        {(targetItem.baseAttack > 0 || targetItem.baseDefense > 0) && (
          <div className="border-t border-white/5 pt-2 flex flex-col gap-0.5 font-mono text-[10px]">
            {targetItem.baseAttack > 0 && <span className="text-emerald-400">+{targetItem.baseAttack} Base Attack</span>}
            {targetItem.baseDefense > 0 && <span className="text-blue-400">+{targetItem.baseDefense} Base Defense</span>}
          </div>
        )}

        {/* Affixes */}
        {affixesList.length > 0 && (
          <div className="border-t border-white/5 pt-2 flex flex-col gap-1">
            <span className="text-[8px] font-pixel text-slate-500 uppercase tracking-wide">Enchantments</span>
            <div className="flex flex-col gap-0.5 font-mono text-[10px] text-cyan-400/90">
              {affixesList.map((aff: any, i: number) => (
                <span key={i}>{formatAffix(aff.type, aff.value)}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[999] hidden md:group-hover:flex gap-4 p-4 bg-[#090d16]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-none select-none text-left"
      style={{
        boxShadow: `0 10px 30px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.1) inset`
      }}
    >
      {/* Left Column: Hovered Item info */}
      <div className="flex flex-col gap-3">
        {renderItemCard(item)}

        {/* Net Changes Section */}
        {equippedItem && diffs.length > 0 && (
          <div className="border-t border-white/10 pt-2 flex flex-col gap-1.5 w-[230px] font-mono text-[9px]">
            <span className="text-[8px] font-pixel text-yellow-500 uppercase tracking-wide">Equip Changes</span>
            <div className="flex flex-col gap-0.5">
              {diffs.map((d, i) => {
                const isPositive = d.diff > 0;
                const formattedDiff = d.isPercent
                  ? `${isPositive ? '+' : ''}${Math.round(d.diff * 100)}%`
                  : `${isPositive ? '+' : ''}${d.diff}`;

                return (
                  <div key={i} className={`flex justify-between items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span>{isPositive ? '▲' : '▼'} {d.label}</span>
                    <span className="font-bold">{formattedDiff}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Equipped Item info (if exists) */}
      {equippedItem && (
        <>
          <div className="w-[1px] bg-white/10 self-stretch" />
          {renderItemCard(equippedItem, '[ Equipped ]')}
        </>
      )}
    </div>
  );
};
