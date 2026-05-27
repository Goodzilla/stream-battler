import React, { useState } from 'react';
import { CharacterVisualizer } from '../components/CharacterVisualizer';
import { PassiveSkillTree } from '../components/PassiveSkillTree';
import { apiFetch } from '../utils/api';
import { CLASSES, TALENTS } from '../game/constants';
import { calculateCharacterStats, xpToNextLevel, getLegendaryDescription } from '../game/formulas';
import { Shield, Sparkles, Heart, Sword, Crosshair, Settings, Award } from 'lucide-react';

interface DashboardProps {
  user: any;
  character: any;
  onUpdateCharacter: (char: any) => void;
  onLogout: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  character,
  onUpdateCharacter,
  onLogout,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'tree' | 'solo' | 'raids' | 'admin'>('inventory');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Admin panel state
  const [adminXp, setAdminXp] = useState('500');
  const [adminGold, setAdminGold] = useState('200');
  const [spawnSlot, setSpawnSlot] = useState<'WEAPON' | 'ARMOR' | 'ACCESSORY'>('WEAPON');
  const [spawnRarity, setSpawnRarity] = useState<'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'>('RARE');
  const [spawnLevel, setSpawnLevel] = useState('10');
  const [promoteName, setPromoteName] = useState('');

  // Active Lobbies state (could be fetched)
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [bossName, setBossName] = useState('Viper the Cyber Snake');
  const [bossLevel, setBossLevel] = useState('10');

  const items = character?.items || [];
  const equipped = items.filter((item: any) => item.isEquipped);
  const inventory = items.filter((item: any) => !item.isEquipped);

  const characterStats = character
    ? calculateCharacterStats(
        character.class,
        character.level,
        JSON.parse(character.talents || '[]'),
        JSON.parse(character.passives || '[]'),
        equipped
      )
    : null;

  // Fetch active lobbies
  const fetchLobbies = async () => {
    try {
      const data = await apiFetch('/lobbies');
      setLobbies(data);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'raids') {
      fetchLobbies();
      const interval = setInterval(fetchLobbies, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSelectClass = async (className: string) => {
    if (
      character.class &&
      !window.confirm(
        'Selecting a new class resets your level to 1, removes all currently owned items, and refunds your skill tree. Continue?'
      )
    )
      return;

    try {
      const data = await apiFetch('/character/select-class', {
        method: 'POST',
        body: JSON.stringify({ charClass: className })
      });
      onUpdateCharacter(data);
      setSelectedItem(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEquipItem = async (itemId: string) => {
    try {
      const updated = await apiFetch('/inventory/equip', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
      onUpdateCharacter(updated);
      // Update selected item viewer
      const newlyEquipped = updated.items.find((i: any) => i.id === itemId);
      setSelectedItem(newlyEquipped);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnequipItem = async (itemId: string) => {
    try {
      const updated = await apiFetch('/inventory/unequip', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
      onUpdateCharacter(updated);
      const newlyUnequipped = updated.items.find((i: any) => i.id === itemId);
      setSelectedItem(newlyUnequipped);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDismantleItem = async (itemId: string) => {
    try {
      const data = await apiFetch('/inventory/dismantle', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
      onUpdateCharacter(data.character);
      setSelectedItem(null);
      alert(`Dismantled for ${data.goldGained} Gold!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectTalent = async (talentId: string) => {
    const currentTalents: string[] = JSON.parse(character.talents || '[]');
    // Match tier and format
    const match = talentId.match(/^t([1-4])_\d+$/);
    if (!match) return;
    const tier = parseInt(match[1]);

    // Strip out any existing talent of the same tier
    const filtered = currentTalents.filter(id => !id.startsWith(`t${tier}_`));
    
    // Toggle on/off: if clicked one was already active, we just removed it. Otherwise, add it.
    const isAlreadySelected = currentTalents.includes(talentId);
    const newTalents = isAlreadySelected ? filtered : [...filtered, talentId];

    try {
      const updated = await apiFetch('/character/select-talents', {
        method: 'POST',
        body: JSON.stringify({ talents: newTalents })
      });
      onUpdateCharacter(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Admin console handlers
  const handleAdminXp = async () => {
    try {
      const res = await apiFetch('/admin/grant-xp', {
        method: 'POST',
        body: JSON.stringify({ xpAmount: adminXp })
      });
      onUpdateCharacter(res.character);
      alert(`Granted ${adminXp} XP! Leveled: ${res.leveledUp}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdminGold = async () => {
    try {
      const updated = await apiFetch('/admin/grant-gold', {
        method: 'POST',
        body: JSON.stringify({ goldAmount: adminGold })
      });
      onUpdateCharacter(updated);
      alert(`Granted ${adminGold} Gold!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSpawnItem = async () => {
    try {
      const item = await apiFetch('/admin/spawn-item', {
        method: 'POST',
        body: JSON.stringify({
          slot: spawnSlot,
          rarity: spawnRarity,
          itemLevel: spawnLevel
        })
      });
      // Fetch user profile again to update items list
      const meData = await apiFetch('/auth/me');
      onUpdateCharacter(meData.character);
      alert(`Spawned: ${item.name}!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetCharacter = async () => {
    if (window.confirm('Wipe this character stats and start fresh?')) {
      try {
        const updated = await apiFetch('/admin/reset-character', { method: 'POST' });
        onUpdateCharacter(updated);
        setSelectedItem(null);
        alert('Character reset!');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handlePromoteUser = async () => {
    if (!promoteName.trim()) return;
    try {
      const res = await apiFetch('/admin/promote-user', {
        method: 'POST',
        body: JSON.stringify({ username: promoteName })
      });
      alert(res.message);
      setPromoteName('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Streamer lobby handler
  const handleCreateLobby = () => {
    onNavigate('streamer-lobby', {
      bossName,
      bossLevel: parseInt(bossLevel) || 10
    });
  };

  // If character has no class, force class selection first
  if (!character || !character.class) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-3xl font-black mb-2 text-white">SELECT YOUR CLASS</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
          Unlock your true path. Choosing a class grants you specific stats, custom talent cards, and your starter weapon and armor.
        </p>

        <div className="grid md:grid-cols-5 gap-6">
          {Object.entries(CLASSES).map(([key, config]) => (
            <div
              key={key}
              onClick={() => handleSelectClass(key)}
              className="glass-panel p-6 cursor-pointer border-white/5 hover:scale-105 transition-all text-center flex flex-col items-center justify-between"
              style={{
                borderColor: `${config.color}22`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.3)`
              }}
            >
              <h3 className="font-display font-semibold text-lg text-white mb-2">{config.name}</h3>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-black"
                style={{ backgroundColor: config.color }}
              >
                {key === 'WARRIOR' && <Shield size={24} />}
                {key === 'MAGE' && <Sparkles size={24} />}
                {key === 'CLERIC' && <Heart size={24} />}
                {key === 'ROGUE' && <Sword size={24} />}
                {key === 'RANGER' && <Crosshair size={24} />}
              </div>
              <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                Active: <span className="text-white font-bold">{config.activeSkill.name}</span>
                <br />
                {config.activeSkill.description}
              </p>
              <button
                className="w-full py-2 rounded text-xs font-display font-bold uppercase tracking-wider text-black"
                style={{ backgroundColor: config.color }}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const xpNeeded = xpToNextLevel(character.level);
  const xpPercent = Math.min(100, Math.round((character.xp / xpNeeded) * 100));

  const talentList = TALENTS[character.class] || {};

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-wider">
            {character.user.displayName.toUpperCase()}
          </h2>
          <span
            className="text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded border mr-2"
            style={{
              borderColor: CLASSES[character.class].color,
              color: CLASSES[character.class].color
            }}
          >
            {CLASSES[character.class].name}
          </span>
          <span className="text-xs text-slate-400">
            Gold: <span className="text-yellow-400 font-bold">{character.gold}g</span>
          </span>
        </div>

        {/* Level XP Bar */}
        <div className="flex-1 max-w-md w-full">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Level {character.level}</span>
            <span className="text-slate-500">
              {character.xp} / {xpNeeded} XP
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${xpPercent}%`,
                backgroundColor: CLASSES[character.class].color
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('leaderboard')}
            className="px-4 py-2 border border-yellow-500/20 text-yellow-500 text-xs font-display font-semibold uppercase tracking-wider rounded-lg hover:bg-yellow-500 hover:text-black transition"
          >
            Leaderboard
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 border border-red-500/20 text-red-400 text-xs font-display font-semibold uppercase tracking-wider rounded-lg hover:bg-red-500 hover:text-black transition"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Left Hand Character visual and Stats */}
        <div className="flex flex-col gap-6 md:col-span-1">
          <div className="glass-panel p-6 border-white/5 flex flex-col items-center">
            <CharacterVisualizer charClass={character.class} equippedItems={equipped} />

            <div className="w-full border-t border-white/5 mt-6 pt-4 flex flex-col gap-2.5 text-xs text-slate-400">
              <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-2 text-center">
                ATTR STATISTICS
              </h3>
              <div className="flex justify-between">
                <span>Maximum HP:</span>
                <span className="text-white font-mono font-bold">{characterStats?.maxHp}</span>
              </div>
              <div className="flex justify-between">
                <span>Attack Power:</span>
                <span className="text-white font-mono font-bold">{characterStats?.attackPower}</span>
              </div>
              <div className="flex justify-between">
                <span>Defense Armor:</span>
                <span className="text-white font-mono font-bold">{characterStats?.defense}</span>
              </div>
              <div className="flex justify-between">
                <span>Crit Chance / Mult:</span>
                <span className="text-white font-mono font-bold">
                  {Math.round((characterStats?.critChance || 0) * 100)}% / {characterStats?.critMult}x
                </span>
              </div>
              <div className="flex justify-between">
                <span>Attack Frequency:</span>
                <span className="text-white font-mono font-bold">{characterStats?.atkSpeed} /s</span>
              </div>
              <div className="flex justify-between">
                <span>Movement Speed:</span>
                <span className="text-white font-mono font-bold">{characterStats?.moveSpeed}</span>
              </div>
              <div className="flex justify-between text-yellow-500">
                <span>Lifesteal:</span>
                <span className="font-mono font-bold">{Math.round((characterStats?.lifesteal || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between text-purple-400">
                <span>Reflected Damage:</span>
                <span className="font-mono font-bold">{Math.round((characterStats?.reflect || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between text-cyan-400">
                <span>Cooldown Reduction:</span>
                <span className="font-mono font-bold">{Math.round((characterStats?.cdr || 0) * 100)}%</span>
              </div>
            </div>

            <button
              onClick={() => handleSelectClass(character.class)}
              className="mt-6 text-[10px] text-red-500 hover:underline cursor-pointer bg-transparent border-0"
            >
              Re-select Class (Resets Character)
            </button>
          </div>
        </div>

        {/* Right Hand Dashboard tabs */}
        <div className="flex flex-col gap-6 md:col-span-2">
          {/* Navigation tabs */}
          <div className="flex border-b border-white/5 gap-2 select-none">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'inventory'
                  ? 'border-cyan-500 text-neon-cyan'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Gear & Inventory
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'tree'
                  ? 'border-cyan-500 text-neon-cyan'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Skill Matrix
            </button>
            <button
              onClick={() => setActiveTab('solo')}
              className={`px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'solo'
                  ? 'border-cyan-500 text-neon-cyan'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Solo Grind
            </button>
            <button
              onClick={() => setActiveTab('raids')}
              className={`px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'raids'
                  ? 'border-cyan-500 text-neon-cyan'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Lobbies & Raids
            </button>
            {user.isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'border-magenta-500 text-neon-magenta'
                    : 'border-transparent text-slate-500 hover:text-white'
                }`}
              >
                <Settings size={12} />
                Admin Panel
              </button>
            )}
          </div>

          {/* TAB CONTENTS */}

          {/* 1. GEAR & INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="flex flex-col gap-6">
              {/* Equipped items */}
              <div className="glass-panel p-6 border-white/5">
                <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-4">
                  EQUIPPED GEAR
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {['WEAPON', 'ARMOR', 'ACCESSORY'].map(slot => {
                    const item = equipped.find((i: any) => i.slot === slot);
                    return (
                      <div
                        key={slot}
                        onClick={() => item && setSelectedItem(item)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center p-3 text-center border relative cursor-pointer transition ${
                          item
                            ? `bg-black/40 border-white/10 hover:border-white/30 item-slot-glow rarity-${item.rarity}`
                            : 'bg-black/10 border-white/5 border-dashed hover:bg-black/20'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 font-display uppercase tracking-widest absolute top-2">
                          {slot}
                        </span>
                        {item ? (
                          <>
                            <span className="text-xs font-display font-medium text-white mb-1 leading-snug">
                              {item.name}
                            </span>
                            <span className={`text-[10px] uppercase font-bold rarity-${item.rarity}`}>
                              ilvl {item.itemLevel}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-600 font-display">EMPTY</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Backpack inventory list */}
              <div className="glass-panel p-6 border-white/5">
                <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-4">
                  BACKPACK ({inventory.length})
                </h3>

                {inventory.length === 0 ? (
                  <div className="text-slate-500 italic text-sm text-center py-6">
                    Backpack is empty. Go farm solo zones or join streamer raids to find loot!
                  </div>
                ) : (
                  <div className="inventory-grid">
                    {inventory.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`inventory-slot item-slot-glow rarity-${item.rarity}`}
                      >
                        <span className="text-xs font-display font-semibold text-white">
                          {item.slot.substring(0, 1)}
                        </span>
                        <div className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-400">
                          {item.itemLevel}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Talents */}
              <div className="glass-panel p-6 border-white/5">
                <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-4">
                  CLASS TALENTS
                </h3>
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4].map(tier => {
                    const reqLevel = tier * 5;
                    const isUnlocked = character.level >= reqLevel;
                    // Find talents of this tier
                    const tierTalents = Object.values(talentList).filter(
                      (t: any) => t.tier === tier
                    );
                    const selected = JSON.parse(character.talents || '[]');

                    return (
                      <div
                        key={tier}
                        className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
                          isUnlocked ? 'bg-black/20 border-white/5' : 'bg-black/5 border-white/5 opacity-40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-white text-xs">
                              TIER {tier} UNLOCK
                            </span>
                            {!isUnlocked && (
                              <span className="text-[10px] text-red-500 uppercase font-display">
                                Requires Level {reqLevel}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">Choose one capability:</span>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                          {tierTalents.map((t: any) => {
                            const isChose = selected.includes(t.id);
                            return (
                              <button
                                key={t.id}
                                disabled={!isUnlocked}
                                onClick={() => handleSelectTalent(t.id)}
                                className={`flex-1 md:flex-initial p-3 text-left border rounded-lg transition min-w-[150px] ${
                                  isChose
                                    ? 'bg-cyan-950/20 border-cyan-500 text-neon-cyan'
                                    : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-400'
                                }`}
                              >
                                <div className="font-display font-bold text-xs mb-1 text-white">
                                  {t.name}
                                </div>
                                <div className="text-[10px] leading-relaxed">{t.description}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Selected Item Drawer details */}
          {activeTab === 'inventory' && selectedItem && (
            <div className="glass-panel p-6 border-white/5 bg-[#101524]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`m-0 font-display text-base rarity-${selectedItem.rarity}`}>
                    {selectedItem.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">
                    Slot: {selectedItem.slot} | Level: {selectedItem.itemLevel}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  X
                </button>
              </div>

              <div className="flex flex-col gap-2 text-xs border-y border-white/5 py-4 my-4">
                {selectedItem.baseAttack > 0 && (
                  <div className="flex justify-between">
                    <span>Base Attack:</span>
                    <span className="text-white font-mono font-bold">+{selectedItem.baseAttack}</span>
                  </div>
                )}
                {selectedItem.baseDefense > 0 && (
                  <div className="flex justify-between">
                    <span>Base Defense:</span>
                    <span className="text-white font-mono font-bold">+{selectedItem.baseDefense}</span>
                  </div>
                )}

                {/* Affixes */}
                {JSON.parse(selectedItem.affixes || '[]').map((affix: any, idx: number) => {
                  if (affix.type.startsWith('legendary_')) {
                    const desc = getLegendaryDescription(affix.type);
                    return (
                      <div key={idx} className="mt-2 p-2 bg-yellow-950/20 border border-yellow-800/20 rounded-md text-yellow-500">
                        <div className="font-display font-bold text-[10px] uppercase flex items-center gap-1">
                          <Award size={12} />
                          LEGENDARY PASSIVE
                        </div>
                        <p className="m-0 mt-0.5 text-[10px] leading-relaxed">{desc}</p>
                      </div>
                    );
                  }

                  const isPercent = [
                    'critChance',
                    'atkSpeedPct',
                    'moveSpeedPct',
                    'lifesteal',
                    'reflect',
                    'cdr'
                  ].includes(affix.type);
                  const displayValue = isPercent
                    ? `+${Math.round(affix.value * 100)}%`
                    : `+${affix.value}`;

                  return (
                    <div key={idx} className="flex justify-between text-cyan-400 font-mono">
                      <span className="capitalize">{affix.type.replace('Pct', '').replace('maxHp', 'health')}</span>
                      <span>{displayValue}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 select-none">
                {!selectedItem.isEquipped ? (
                  <>
                    <button
                      onClick={() => handleDismantleItem(selectedItem.id)}
                      className="px-4 py-2 border border-red-950/50 text-red-500 hover:bg-red-500 hover:text-black rounded text-xs font-display font-bold uppercase transition"
                    >
                      Dismantle
                    </button>
                    <button
                      onClick={() => handleEquipItem(selectedItem.id)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-display font-bold uppercase transition"
                    >
                      Equip Item
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleUnequipItem(selectedItem.id)}
                    className="px-4 py-2 border border-white/10 hover:border-white/30 text-white rounded text-xs font-display font-bold uppercase transition"
                  >
                    Unequip
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. PASSIVE skill tree matrix */}
          {activeTab === 'tree' && (
            <PassiveSkillTree character={character} onUpdateCharacter={onUpdateCharacter} />
          )}

          {/* 3. SOLO GRIND zones mapping */}
          {activeTab === 'solo' && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'Forest of Trials', level: 1, desc: 'A dense wood where monsters roam. Ideal for level 1 characters.' },
                { name: 'Neon Caves', level: 5, desc: 'Glowing crystal tunnels. Watch out for rapid neon bats.' },
                { name: 'Obsidian Ruins', level: 10, desc: 'Cursed obsidian pillars and flame skeletons.' },
                { name: 'Cyber Core Engine', level: 15, desc: 'A complex web of cables and robotic drones.' },
                { name: 'Volcanic Rift', level: 20, desc: 'Lava flows, magma giants, and epic materials.' }
              ].map(zone => {
                const isUnderlevel = character.level < zone.level;
                return (
                  <div
                    key={zone.name}
                    className={`glass-panel p-6 border-white/5 flex flex-col justify-between items-start gap-4 transition ${
                      isUnderlevel ? 'opacity-50' : 'hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center w-full mb-1">
                        <h4 className="m-0 text-white font-display text-sm tracking-wide">
                          {zone.name.toUpperCase()}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">Zone lvl {zone.level}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed m-0 mt-2">{zone.desc}</p>
                      {isUnderlevel && (
                        <p className="text-[10px] text-red-500 font-display uppercase font-bold mt-2">
                          Warning: Recommended level {zone.level}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onNavigate('solo-arena', { mapLevel: zone.level })}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition w-full"
                    >
                      Launch Autobattle
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. ACTIVE LOBBIES / RAID HOSTING */}
          {activeTab === 'raids' && (
            <div className="flex flex-col gap-6">
              {/* Creator screen for Streamers */}
              <div className="glass-panel p-6 border-white/5 bg-black/20">
                <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-4">
                  STREAMER CONSOLE: HOST LOBBY
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Set up a custom lobby wave. Viewers can type <span className="text-[#af52de] font-bold">!join</span> in your simulated chat, or browse this page to hop in. When you start the raid, your browser will coordinate the canvas physics.
                </p>

                <div className="flex flex-wrap gap-4 items-end mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-display text-slate-400 uppercase tracking-wide mb-1.5">
                      Raid Boss Name
                    </label>
                    <input
                      type="text"
                      value={bossName}
                      onChange={e => setBossName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#05070a] border border-white/5 rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-display text-slate-400 uppercase tracking-wide mb-1.5">
                      Boss Level
                    </label>
                    <input
                      type="number"
                      value={bossLevel}
                      onChange={e => setBossLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#05070a] border border-white/5 rounded text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCreateLobby}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                  >
                    Open Lobby
                  </button>
                </div>
              </div>

              {/* Lobbies browser for Players */}
              <div className="glass-panel p-6 border-white/5">
                <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-4">
                  ACTIVE LOBBIES
                </h3>

                {lobbies.length === 0 ? (
                  <div className="text-slate-500 italic text-sm text-center py-6">
                    No active streamer lobbies found. Encourage a streamer to open one, or create one yourself above!
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {lobbies.map((lob: any) => (
                      <div
                        key={lob.streamerName}
                        className="p-4 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center gap-4 hover:border-white/10 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-white text-xs uppercase">
                              #{lob.streamerName}
                            </span>
                            <span
                              className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                lob.status === 'FIGHTING'
                                  ? 'bg-red-950/20 text-red-400 border border-red-900/30'
                                  : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'
                              }`}
                            >
                              {lob.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Boss: <span className="text-white font-bold">{lob.bossName}</span> (lvl {lob.bossLevel})
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Viewers joined: <span className="text-cyan-400">{lob.viewers.length}</span>
                          </div>
                        </div>

                        <button
                          disabled={lob.status === 'FIGHTING'}
                          onClick={() =>
                            onNavigate('viewer-lobby', { streamerName: lob.streamerName })
                          }
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs font-display font-bold uppercase tracking-wider transition"
                        >
                          Join Raid
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. ADMIN CONSOLE DEV MODE */}
          {activeTab === 'admin' && user.isAdmin && (
            <div className="glass-panel p-6 border-white/5 bg-black/20 flex flex-col gap-6">
              <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-2 flex items-center gap-1 text-neon-magenta">
                <Settings size={16} />
                ADMIN DEV OPTIONS (PRODUCTION BYPASS)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                These controls modify the SQLite database immediately. Available in production *only* for account owners flagged as `isAdmin = true`.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* XP / Gold grants */}
                <div className="p-4 bg-black/25 border border-white/5 rounded-xl flex flex-col gap-4">
                  <h4 className="m-0 font-display text-xs text-white uppercase tracking-wider">
                    Modify Resources
                  </h4>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[9px] font-display text-slate-500 uppercase mb-1">
                        XP Amount
                      </label>
                      <input
                        type="number"
                        value={adminXp}
                        onChange={e => setAdminXp(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#05070a] border border-white/5 rounded text-xs text-white"
                      />
                    </div>
                    <button
                      onClick={handleAdminXp}
                      className="px-3 py-1.5 bg-magenta-900/40 text-neon-magenta border border-magenta-700/40 rounded text-xs hover:bg-magenta-700 hover:text-black font-display font-bold transition"
                    >
                      Grant XP
                    </button>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[9px] font-display text-slate-500 uppercase mb-1">
                        Gold Amount
                      </label>
                      <input
                        type="number"
                        value={adminGold}
                        onChange={e => setAdminGold(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#05070a] border border-white/5 rounded text-xs text-white"
                      />
                    </div>
                    <button
                      onClick={handleAdminGold}
                      className="px-3 py-1.5 bg-magenta-900/40 text-neon-magenta border border-magenta-700/40 rounded text-xs hover:bg-magenta-700 hover:text-black font-display font-bold transition"
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
                      <label className="block text-[9px] font-display text-slate-500 uppercase mb-1">
                        Slot
                      </label>
                      <select
                        value={spawnSlot}
                        onChange={e => setSpawnSlot(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-[#05070a] border border-white/5 rounded text-[10px] text-white"
                      >
                        <option value="WEAPON">WEAPON</option>
                        <option value="ARMOR">ARMOR</option>
                        <option value="ACCESSORY">ACCESSORY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-display text-slate-500 uppercase mb-1">
                        Rarity
                      </label>
                      <select
                        value={spawnRarity}
                        onChange={e => setSpawnRarity(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-[#05070a] border border-white/5 rounded text-[10px] text-white"
                      >
                        <option value="COMMON">COMMON</option>
                        <option value="UNCOMMON">UNCOMMON</option>
                        <option value="RARE">RARE</option>
                        <option value="EPIC">EPIC</option>
                        <option value="LEGENDARY">LEGENDARY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-display text-slate-500 uppercase mb-1">
                        Item Lvl
                      </label>
                      <input
                        type="number"
                        value={spawnLevel}
                        onChange={e => setSpawnLevel(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#05070a] border border-white/5 rounded text-[10px] text-white"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSpawnItem}
                    className="w-full py-2 bg-magenta-900/40 text-neon-magenta border border-magenta-700/40 rounded text-xs hover:bg-magenta-700 hover:text-black font-display font-bold uppercase transition"
                  >
                    Spawn Item
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-2">
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
                      className="flex-1 px-3 py-1.5 bg-[#05070a] border border-white/5 rounded text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handlePromoteUser}
                      className="px-4 py-1.5 bg-[#af52de]/30 text-[#c974f1] border border-[#af52de]/30 rounded text-xs hover:bg-[#af52de] hover:text-white transition font-display font-bold"
                    >
                      Promote
                    </button>
                  </div>
                </div>

                {/* Reset Character */}
                <div className="p-4 bg-black/25 border border-white/5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="m-0 font-display text-xs text-red-500 uppercase tracking-wider mb-1">
                      Danger Zone
                    </h4>
                    <p className="text-[10px] text-slate-500 m-0">
                      Wipes all items, levels, and gold immediately. Reinitializes starter gear.
                    </p>
                  </div>
                  <button
                    onClick={handleResetCharacter}
                    className="mt-4 w-full py-2 bg-red-950/20 text-red-500 border border-red-900/30 hover:bg-red-500 hover:text-black rounded text-xs font-display font-bold uppercase transition"
                  >
                    Wipe/Reset Character
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
