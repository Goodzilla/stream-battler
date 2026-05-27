import React from 'react';
import { Settings } from 'lucide-react';

interface AdminPanelTabProps {
  adminXp: string;
  setAdminXp: (val: string) => void;
  adminGold: string;
  setAdminGold: (val: string) => void;
  spawnSlot: 'WEAPON' | 'ARMOR' | 'ACCESSORY';
  setSpawnSlot: (val: 'WEAPON' | 'ARMOR' | 'ACCESSORY') => void;
  spawnRarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  setSpawnRarity: (val: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY') => void;
  spawnLevel: string;
  setSpawnLevel: (val: string) => void;
  promoteName: string;
  setPromoteName: (val: string) => void;
  onAdminXp: () => void;
  onAdminGold: () => void;
  onSpawnItem: () => void;
  onResetCharacter: () => void;
  onPromoteUser: () => void;
}

export const AdminPanelTab: React.FC<AdminPanelTabProps> = ({
  adminXp,
  setAdminXp,
  adminGold,
  setAdminGold,
  spawnSlot,
  setSpawnSlot,
  spawnRarity,
  setSpawnRarity,
  spawnLevel,
  setSpawnLevel,
  promoteName,
  setPromoteName,
  onAdminXp,
  onAdminGold,
  onSpawnItem,
  onResetCharacter,
  onPromoteUser
}) => {
  return (
    <div className="glass-panel p-6 border-white/5 bg-black/20 flex flex-col gap-6">
      <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-2 flex items-center gap-1 text-neon-magenta">
        <Settings size={14} />
        ADMIN DEV OPTIONS (PRODUCTION BYPASS)
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        These controls modify the SQLite database immediately. Available in production only for account owners flagged as `isAdmin = true`.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Resources */}
        <div className="p-4 bg-black/25 border border-white/5 rounded-xl flex flex-col gap-4">
          <h4 className="m-0 font-display text-xs text-white uppercase tracking-wider">
            Modify Resources
          </h4>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                XP Amount
              </label>
              <input
                type="number"
                value={adminXp}
                onChange={e => setAdminXp(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#05070a] border border-white/10 rounded text-xs text-white"
              />
            </div>
            <button
              onClick={onAdminXp}
              className="px-3 py-1.5 bg-magenta-900/30 text-neon-magenta border border-magenta-700/30 rounded text-xs hover:bg-magenta-700 hover:text-black font-display font-bold transition duration-300"
            >
              Grant XP
            </button>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                Gold Amount
              </label>
              <input
                type="number"
                value={adminGold}
                onChange={e => setAdminGold(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#05070a] border border-white/10 rounded text-xs text-white"
              />
            </div>
            <button
              onClick={onAdminGold}
              className="px-3 py-1.5 bg-magenta-900/30 text-neon-magenta border border-magenta-700/30 rounded text-xs hover:bg-magenta-700 hover:text-black font-display font-bold transition duration-300"
            >
              Grant Gold
            </button>
          </div>
        </div>

        {/* Spawner */}
        <div className="p-4 bg-black/25 border border-white/5 rounded-xl flex flex-col gap-4">
          <h4 className="m-0 font-display text-xs text-white uppercase tracking-wider">
            Spawn Custom Item
          </h4>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                Slot
              </label>
              <select
                value={spawnSlot}
                onChange={e => setSpawnSlot(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-[#05070a] border border-white/10 rounded text-[10px] text-white focus:outline-none"
              >
                <option value="WEAPON">WEAPON</option>
                <option value="ARMOR">ARMOR</option>
                <option value="ACCESSORY">ACCESSORY</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                Rarity
              </label>
              <select
                value={spawnRarity}
                onChange={e => setSpawnRarity(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-[#05070a] border border-white/10 rounded text-[10px] text-white focus:outline-none"
              >
                <option value="COMMON">COMMON</option>
                <option value="UNCOMMON">UNCOMMON</option>
                <option value="RARE">RARE</option>
                <option value="EPIC">EPIC</option>
                <option value="LEGENDARY">LEGENDARY</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                Item Lvl
              </label>
              <input
                type="number"
                value={spawnLevel}
                onChange={e => setSpawnLevel(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#05070a] border border-white/10 rounded text-[10px] text-white"
              />
            </div>
          </div>

          <button
            onClick={onSpawnItem}
            className="w-full py-2 bg-magenta-900/30 text-neon-magenta border border-magenta-700/30 rounded text-xs hover:bg-magenta-700 hover:text-black font-display font-bold uppercase transition duration-300"
          >
            Spawn Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Promote users */}
        <div className="p-4 bg-black/25 border border-white/5 rounded-xl flex flex-col gap-4">
          <h4 className="m-0 font-display text-xs text-white uppercase tracking-wider">
            Promote Player to Admin
          </h4>
          <div className="flex gap-2 items-end">
            <input
              type="text"
              placeholder="Type username..."
              value={promoteName}
              onChange={e => setPromoteName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-[#05070a] border border-white/10 rounded text-xs text-white focus:outline-none"
            />
            <button
              onClick={onPromoteUser}
              className="px-4 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded text-xs hover:bg-purple-500 hover:text-white transition duration-300 font-display font-bold"
            >
              Promote
            </button>
          </div>
        </div>

        {/* Reset Character */}
        <div className="p-4 bg-black/25 border border-white/5 rounded-xl flex flex-col justify-between gap-4">
          <div>
            <h4 className="m-0 font-display text-xs text-white uppercase tracking-wider">
              Reset Active Character
            </h4>
            <p className="text-[9px] text-slate-500 mt-1 leading-relaxed uppercase">
              Warning: wipes level to 1, removes allocated skill tree, and equips commons.
            </p>
          </div>
          <button
            onClick={onResetCharacter}
            className="w-full py-2 bg-red-950/40 text-red-400 hover:text-white border border-red-900/40 hover:bg-red-600 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
          >
            Reset Active Profile
          </button>
        </div>
      </div>
    </div>
  );
};
