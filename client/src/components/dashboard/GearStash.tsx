import React from 'react';

interface GearStashProps {
  equipped: any[];
  inventory: any[];
  selectedItem: any | null;
  setSelectedItem: (item: any | null) => void;
  onEquipItem: (itemId: string) => void;
  onUnequipItem: (itemId: string) => void;
  onDismantleItem: (itemId: string) => void;
  onDismantleAll: () => void;
}

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

export const getItemGoldValue = (item: { itemLevel: number; rarity: string }) => {
  let value = item.itemLevel * 3;
  switch (item.rarity) {
    case 'UNCOMMON': value += 8; break;
    case 'RARE': value += 20; break;
    case 'EPIC': value += 60; break;
    case 'LEGENDARY': value += 200; break;
  }
  return value;
};

export const GearStash: React.FC<GearStashProps> = ({
  equipped,
  inventory,
  selectedItem,
  setSelectedItem,
  onEquipItem,
  onUnequipItem,
  onDismantleItem,
  onDismantleAll
}) => {
  return (
    <div className="flex flex-col gap-6 animate-scaleUp">
      
      {/* Row 1: Equipped Gear Horizontal Layout */}
      <div className="glass-panel p-5 border-white/5 bg-black/25 flex flex-col gap-3.5">
        <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-2 text-neon-cyan">
          Equipped Gear
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['WEAPON', 'ARMOR', 'ACCESSORY'].map(slot => {
            const item = equipped.find((i: any) => i.slot === slot);
            return (
              <div
                key={slot}
                onClick={() => item && setSelectedItem(item)}
                className={`p-4 rounded-xl flex flex-col justify-between border cursor-pointer transition duration-300 min-h-[95px] relative ${
                  item
                    ? `bg-black/50 border-white/15 hover:border-white/30 item-slot-glow rarity-${item.rarity}`
                    : 'bg-black/20 border-white/5 border-dashed hover:bg-black/30'
                }`}
                style={item ? {
                  borderColor: `var(--rarity-${item.rarity.toLowerCase()})`,
                  boxShadow: `0 0 10px rgba(var(--rarity-${item.rarity.toLowerCase()}-rgb), 0.15)`
                } : undefined}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] text-slate-500 font-pixel uppercase">
                    {slot}
                  </span>
                  {item && (
                    <span className="text-[8px] font-mono uppercase font-bold" style={{ color: `var(--rarity-${item.rarity.toLowerCase()})` }}>
                      {item.rarity}
                    </span>
                  )}
                </div>
                {item ? (
                  <div className="mt-1 flex flex-col">
                    <span className="text-xs font-display font-bold text-white leading-snug">
                      {item.name}
                    </span>
                    <div className="text-[9px] font-mono text-slate-400 mt-1 flex flex-col gap-0.5">
                      {item.baseAttack > 0 && <span className="text-emerald-400">+{item.baseAttack} Atk</span>}
                      {item.baseDefense > 0 && <span className="text-blue-400">+{item.baseDefense} Def</span>}
                      {(typeof item.affixes === 'string' ? JSON.parse(item.affixes) : item.affixes).map((aff: any, i: number) => (
                        <span key={i} className="text-cyan-400">{formatAffix(aff.type, aff.value)}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600 mt-2">EMPTY SLOT</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Backpack Inventory Stash Full-width Layout */}
      <div className="glass-panel p-5 border-white/5 bg-black/25">
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider text-neon-cyan">
            Backpack Inventory Stash
          </h3>
          {inventory.length > 0 && (
            <button
              onClick={onDismantleAll}
              className="px-3 py-1 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/40 hover:border-red-600 rounded text-[10px] font-display font-bold uppercase tracking-wider transition duration-300"
            >
              Sell All
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {Array.from({ length: 30 }).map((_, idx) => {
            const item = inventory[idx];
            return (
              <div
                key={idx}
                onClick={() => item && setSelectedItem(item)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition duration-300 relative ${
                  item
                    ? `bg-black/40 border-white/10 hover:border-white/20 cursor-pointer item-slot-glow rarity-${item.rarity} p-1`
                    : 'bg-black/10 border-white/5 border-dashed cursor-default'
                }`}
                style={item ? {
                  borderColor: `var(--rarity-${item.rarity.toLowerCase()})`
                } : undefined}
              >
                {item ? (
                  <div className="flex flex-col items-center text-center w-full">
                    <span className="text-[9px] text-white font-bold leading-tight truncate w-full px-0.5">
                      {item.name.split(' ').slice(-1)[0]}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 font-bold uppercase mt-0.5">
                      Lvl {item.itemLevel}
                    </span>
                    <span className="text-[8px] font-pixel text-slate-600 uppercase mt-0.5 scale-90">
                      {item.slot[0]}
                    </span>
                  </div>
                ) : (
                  <span className="text-[8px] font-mono text-slate-700 select-none">{idx + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Inspect Selected Gear Tooltip/Detail Panel */}
      {selectedItem && (
        <div className="glass-panel p-6 border-white/10 bg-[#0c1221] shadow-2xl flex flex-col gap-4 relative animate-scaleUp">
          <button 
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-xs"
          >
            CLOSE [X]
          </button>
          
          <div>
            <span className="text-[8px] font-pixel text-slate-500 uppercase tracking-widest">[ Inspecting Gear Item ]</span>
            <h3 className="text-lg font-display font-black text-white m-0 mt-1 leading-none flex items-center gap-2">
              {selectedItem.name}
              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded-full font-bold" 
                    style={{
                      borderColor: `var(--rarity-${selectedItem.rarity.toLowerCase()})`,
                      color: `var(--rarity-${selectedItem.rarity.toLowerCase()})`,
                      backgroundColor: `rgba(0,0,0,0.2)`
                    }}>
                {selectedItem.rarity}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs font-mono border-t border-white/5 pt-4">
            <div>
              <span className="text-slate-500 block">Item Slot:</span>
              <span className="text-white font-bold">{selectedItem.slot}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Required Level:</span>
              <span className="text-white font-bold">lvl {selectedItem.itemLevel}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Sell Value:</span>
              <span className="text-yellow-500 font-bold">{getItemGoldValue(selectedItem)} Gold</span>
            </div>
            {selectedItem.baseAttack > 0 && (
              <div>
                <span className="text-slate-500 block">Base Attack:</span>
                <span className="text-emerald-400 font-bold">+{selectedItem.baseAttack} Power</span>
              </div>
            )}
            {selectedItem.baseDefense > 0 && (
              <div>
                <span className="text-slate-500 block">Base Defense:</span>
                <span className="text-blue-400 font-bold">+{selectedItem.baseDefense} Armor</span>
              </div>
            )}
          </div>

          {/* Affixes list formatted */}
          <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
            <span className="text-[9px] font-pixel text-slate-500 uppercase tracking-wider">Rolled Enchantments</span>
            <div className="flex flex-col gap-1.5">
              {(typeof selectedItem.affixes === 'string' ? JSON.parse(selectedItem.affixes || '[]') : selectedItem.affixes || []).map((aff: any, index: number) => (
                <div key={index} className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>
                    {formatAffix(aff.type, aff.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Equip & Sell Actions */}
          <div className="border-t border-white/5 pt-5 flex gap-4 mt-2">
            {selectedItem.isEquipped ? (
              <button
                onClick={() => onUnequipItem(selectedItem.id)}
                className="flex-1 py-2.5 bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-black border border-yellow-500/40 hover:border-yellow-500 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
              >
                Unequip
              </button>
            ) : (
              <>
                <button
                  onClick={() => onEquipItem(selectedItem.id)}
                  className="flex-1 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-black border border-emerald-500/40 hover:border-emerald-500 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                >
                  Equip Gear
                </button>
                <button
                  onClick={() => onDismantleItem(selectedItem.id)}
                  className="px-6 py-2.5 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/40 hover:border-red-600 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                >
                  Sell Item
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
