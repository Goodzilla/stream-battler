import React, { useState, useEffect } from 'react';
import { CharacterVisualizer } from '../components/CharacterVisualizer';
import { PassiveSkillTree } from '../components/PassiveSkillTree';
import { apiFetch } from '../utils/api';
import { CLASSES, TALENTS } from '../game/constants';
import { calculateCharacterStats, xpToNextLevel, getLegendaryDescription } from '../game/formulas';
import { 
  Shield, Sparkles, Heart, Sword, Crosshair, Settings,
  ShoppingBag, RefreshCw, Coins, LogOut, Zap, ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [activeTab, setActiveTab] = useState<'inventory' | 'tree' | 'shop' | 'solo' | 'raids' | 'admin'>('inventory');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Shop state
  const [shopStock, setShopStock] = useState<any[]>([]);
  const [shopGold, setShopGold] = useState<number>(user?.gold || 0);
  const [shopLoading, setShopLoading] = useState(false);
  const [gambledItem, setGambledItem] = useState<any | null>(null);

  // Admin panel state
  const [adminXp, setAdminXp] = useState('500');
  const [adminGold, setAdminGold] = useState('200');
  const [spawnSlot, setSpawnSlot] = useState<'WEAPON' | 'ARMOR' | 'ACCESSORY'>('WEAPON');
  const [spawnRarity, setSpawnRarity] = useState<'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'>('RARE');
  const [spawnLevel, setSpawnLevel] = useState('10');
  const [promoteName, setPromoteName] = useState('');

  // Active Lobbies state
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [bossName, setBossName] = useState('Viper the Cyber Snake');
  const [bossLevel, setBossLevel] = useState('10');

  // Synchronize gold when user object updates
  useEffect(() => {
    if (user) {
      setShopGold(user.gold);
    }
  }, [user]);

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

  // Fetch shop stock
  const fetchShopData = async () => {
    setShopLoading(true);
    try {
      const data = await apiFetch('/shop');
      setShopStock(data.shopStock);
      setShopGold(data.gold);
    } catch (err) {
      console.error(err);
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'raids') {
      fetchLobbies();
      const interval = setInterval(fetchLobbies, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'shop') {
      fetchShopData();
    }
  }, [activeTab]);

  const handleSelectClass = async (className: string) => {
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
      setShopGold(data.character.user.gold);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectTalent = async (talentId: string) => {
    const currentTalents: string[] = JSON.parse(character.talents || '[]');
    const match = talentId.match(/^t([1-4])_\d+$/);
    if (!match) return;
    const tier = parseInt(match[1]);

    const filtered = currentTalents.filter(id => !id.startsWith(`t${tier}_`));
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

  // Shop actions
  const handleRefreshShop = async () => {
    if (shopGold < 10) {
      alert('You need 10 gold to refresh the shop!');
      return;
    }
    try {
      const data = await apiFetch('/shop/refresh', { method: 'POST' });
      onUpdateCharacter(data.character);
      setShopStock(data.shopStock);
      setShopGold(data.character.user.gold);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBuyShopItem = async (shopItemId: string, price: number) => {
    if (shopGold < price) {
      alert('Insufficient Gold!');
      return;
    }
    try {
      const data = await apiFetch('/shop/buy', {
        method: 'POST',
        body: JSON.stringify({ shopItemId })
      });
      onUpdateCharacter(data.character);
      setShopStock(data.shopStock);
      setShopGold(data.character.user.gold);
      confetti({ particleCount: 60, spread: 40, colors: ['#00d8ff', '#d946ef', '#ffea00'] });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGambleItem = async (slot: string) => {
    const gamblePrice = character.level * 40;
    if (shopGold < gamblePrice) {
      alert('Insufficient Gold!');
      return;
    }
    try {
      const data = await apiFetch('/shop/gamble', {
        method: 'POST',
        body: JSON.stringify({ slot })
      });
      onUpdateCharacter(data.character);
      setShopGold(data.character.user.gold);
      setGambledItem(data.droppedItem);
      
      // Rarity colored confetti effects!
      const colors = 
        data.droppedItem.rarity === 'LEGENDARY' ? ['#ff9500', '#ffaa44', '#ffffff'] :
        data.droppedItem.rarity === 'EPIC' ? ['#af52de', '#d946ef', '#ffffff'] : ['#007aff', '#34c759'];
      confetti({ particleCount: 100, spread: 80, colors });

      setTimeout(() => setGambledItem(null), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Admin handlers
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
      setShopGold(updated.user.gold);
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

  const handleCreateLobby = () => {
    onNavigate('streamer-lobby', {
      bossName,
      bossLevel: parseInt(bossLevel) || 10
    });
  };

  // If character has no class (should be rare due to initial setups), force selector
  if (!character || !character.class) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-3xl font-black mb-3 text-white">SELECT YOUR CLASS</h2>
        <p className="text-slate-400 text-xs font-pixel uppercase tracking-widest max-w-lg mx-auto mb-12 leading-relaxed">
          [ Unlock your path to start battle simulation ]
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {Object.entries(CLASSES).map(([key, config]) => (
            <div
              key={key}
              onClick={() => handleSelectClass(key)}
              className="glass-panel p-6 cursor-pointer border-white/5 hover:border-white/20 hover:scale-105 transition-all text-center flex flex-col items-center justify-between"
              style={{
                borderColor: `${config.color}22`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.3)`
              }}
            >
              <h3 className="font-display font-semibold text-base text-white mb-2">{config.name}</h3>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-black font-bold"
                style={{ backgroundColor: config.color }}
              >
                {key === 'WARRIOR' && <Shield size={22} />}
                {key === 'MAGE' && <Sparkles size={22} />}
                {key === 'CLERIC' && <Heart size={22} />}
                {key === 'ROGUE' && <Sword size={22} />}
                {key === 'RANGER' && <Crosshair size={22} />}
              </div>
              <p className="text-[10px] text-slate-400 mb-6 leading-relaxed">
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
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col gap-6">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="glass-panel p-6 border-white/5 bg-[#090e1a]/95 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500/20" style={{ backgroundColor: CLASSES[character.class]?.color }} />
        
        <div className="flex flex-col gap-1.5 pl-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-white m-0 tracking-wider">
              {character.user.displayName.toUpperCase()}
            </h2>
            <span
              className="text-[9px] font-pixel uppercase px-2 py-0.5 rounded border shadow-sm"
              style={{
                borderColor: `${CLASSES[character.class]?.color}55`,
                color: CLASSES[character.class]?.color,
                backgroundColor: `${CLASSES[character.class]?.color}11`
              }}
            >
              {CLASSES[character.class]?.name}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono mt-1 text-slate-400">
            <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm">
              <Coins className="w-4 h-4 shrink-0" />
              <span>{shopGold} <span className="text-[10px] font-normal uppercase text-yellow-600/70">Gold</span></span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div>
              Backpack Stash: <span className="text-white font-bold">{inventory.length}</span> / 30 Slots
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="flex-1 max-w-md w-full">
          <div className="flex justify-between text-[10px] font-pixel text-slate-400 mb-1.5">
            <span>LEVEL {character.level}</span>
            <span>{character.xp} / {xpNeeded} XP</span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${xpPercent}%`,
                backgroundColor: CLASSES[character.class].color,
                boxShadow: `0 0 10px ${CLASSES[character.class].color}88`
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onNavigate('leaderboard')}
            className="px-4 py-2.5 border border-yellow-500/20 text-yellow-500 text-xs font-display font-semibold uppercase tracking-wider rounded-lg hover:bg-yellow-500 hover:text-black transition duration-300"
          >
            Leaderboard
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 border border-red-500/20 text-red-400 text-xs font-display font-semibold uppercase tracking-wider rounded-lg hover:bg-red-500 hover:text-black transition duration-300 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Character Emblem & Stat Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Emblem wireframe */}
          <div className="glass-panel p-6 border-white/5 bg-[#090e1a]/95 flex flex-col items-center shadow-lg relative">
            <div className="absolute top-3 left-4 text-[9px] font-pixel text-slate-500 uppercase tracking-widest">[ Core Matrix ]</div>
            <CharacterVisualizer charClass={character.class} equippedItems={equipped} />

            {/* Attributes List */}
            <div className="w-full border-t border-white/5 mt-6 pt-5 flex flex-col gap-2.5 text-xs text-slate-400">
              <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-2 text-center text-neon-cyan">
                Combat Stats
              </h3>
              
              <div className="flex justify-between font-mono py-1 border-b border-white/5">
                <span>Maximum HP:</span>
                <span className="text-white font-bold">{characterStats?.maxHp}</span>
              </div>
              <div className="flex justify-between font-mono py-1 border-b border-white/5">
                <span>Attack Power:</span>
                <span className="text-white font-bold">{characterStats?.attackPower}</span>
              </div>
              <div className="flex justify-between font-mono py-1 border-b border-white/5">
                <span>Defense Armor:</span>
                <span className="text-white font-bold">{characterStats?.defense}</span>
              </div>
              <div className="flex justify-between font-mono py-1 border-b border-white/5">
                <span>Crit Chance / Mult:</span>
                <span className="text-white font-bold">
                  {Math.round((characterStats?.critChance || 0) * 100)}% / {characterStats?.critMult}x
                </span>
              </div>
              <div className="flex justify-between font-mono py-1 border-b border-white/5">
                <span>Attack Speed:</span>
                <span className="text-white font-bold">{characterStats?.atkSpeed} /s</span>
              </div>
              <div className="flex justify-between font-mono py-1 border-b border-white/5">
                <span>Movement Speed:</span>
                <span className="text-white font-bold">{characterStats?.moveSpeed}</span>
              </div>
              <div className="flex justify-between font-mono py-1 border-b border-white/5 text-emerald-400">
                <span>Lifesteal:</span>
                <span className="font-bold">{Math.round((characterStats?.lifesteal || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between font-mono py-1 border-b border-white/5 text-purple-400">
                <span>Reflect Armor:</span>
                <span className="font-bold">{Math.round((characterStats?.reflect || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between font-mono py-1 text-cyan-400">
                <span>Cooldown Reduc.:</span>
                <span className="font-bold">{Math.round((characterStats?.cdr || 0) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* CLASS SWITCHER PANEL */}
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
                    onClick={() => !isActive && handleSelectClass(key)}
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

        </div>

        {/* RIGHT COLUMN: Interactive Tabs & Panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Sub Tab Navigation */}
          <div className="flex border-b border-white/5 gap-2 select-none overflow-x-auto pb-1">
            {[
              { id: 'inventory', label: 'Gear & Stash' },
              { id: 'tree', label: 'Skill Tree' },
              { id: 'shop', label: 'Merchant Shop' },
              { id: 'solo', label: 'Solo Arena' },
              { id: 'raids', label: 'Lobbies & Raids' },
              { id: 'admin', label: 'Admin Panel', adminOnly: true }
            ].map(tab => {
              if (tab.adminOnly && !character.user.isAdmin) return null;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider border-b-2 transition shrink-0 ${
                    isTabActive
                      ? 'border-cyan-500 text-neon-cyan'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}

          {/* 1. GEAR & STASH TAB */}
          {activeTab === 'inventory' && (
            <div className="flex flex-col gap-6">
              
              {/* Equipped items */}
              <div className="glass-panel p-6 border-white/5 bg-black/25">
                <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-4 text-neon-cyan">
                  Equipped Gear
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {['WEAPON', 'ARMOR', 'ACCESSORY'].map(slot => {
                    const item = equipped.find((i: any) => i.slot === slot);
                    return (
                      <div
                        key={slot}
                        onClick={() => item && setSelectedItem(item)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center p-3 text-center border relative cursor-pointer transition duration-300 ${
                          item
                            ? `bg-black/50 border-white/15 hover:border-white/30 item-slot-glow rarity-${item.rarity}`
                            : 'bg-black/20 border-white/5 border-dashed hover:bg-black/30'
                        }`}
                      >
                        <span className="text-[9px] text-slate-500 font-pixel uppercase absolute top-2.5">
                          {slot}
                        </span>
                        {item ? (
                          <>
                            <span className="text-xs font-display font-medium text-white mb-1 leading-snug mt-3">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-mono uppercase font-bold" style={{ color: `var(--rarity-${item.rarity.toLowerCase()})` }}>
                              {item.rarity}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 mt-2">EMPTY</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Backpack Stash */}
              <div className="glass-panel p-6 border-white/5 bg-black/25">
                <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-4 text-neon-cyan">
                  Backpack Inventory Stash
                </h3>
                <div className="grid grid-cols-5 md:grid-cols-8 gap-3">
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const item = inventory[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => item && setSelectedItem(item)}
                        className={`aspect-square rounded-lg flex items-center justify-center border transition duration-300 relative ${
                          item
                            ? `bg-black/40 border-white/10 hover:border-white/20 cursor-pointer item-slot-glow rarity-${item.rarity}`
                            : 'bg-black/10 border-white/5 border-dashed cursor-default'
                        }`}
                      >
                        {item ? (
                          <div className="flex flex-col items-center text-center p-1">
                            <span className="text-[9px] text-white font-bold leading-tight truncate w-full max-w-[55px]">
                              {item.name.split(' ').slice(-1)[0]}
                            </span>
                            <span className="text-[8px] font-mono text-slate-500 font-bold uppercase mt-0.5">
                              Lvl {item.itemLevel}
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

              {/* Inspect Gear Panel */}
              {selectedItem && (
                <div className="glass-panel p-6 border-white/10 bg-[#0c1221] shadow-2xl flex flex-col gap-4 relative">
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-xs"
                  >
                    CLOSE [X]
                  </button>
                  
                  <div>
                    <span className="text-[8px] font-pixel text-slate-500 uppercase tracking-widest">[ Inspecting Stash Item ]</span>
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

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-white/5 pt-4">
                    <div>
                      <span className="text-slate-500 block">Item Slot:</span>
                      <span className="text-white font-bold">{selectedItem.slot}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Required Level:</span>
                      <span className="text-white font-bold">lvl {selectedItem.itemLevel}</span>
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

                  {/* Affixes list */}
                  <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
                    <span className="text-[9px] font-pixel text-slate-500 uppercase tracking-wider">Rolled Enchantments</span>
                    <div className="flex flex-col gap-1.5">
                      {JSON.parse(selectedItem.affixes || '[]').map((aff: any, index: number) => (
                        <div key={index} className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span>
                            +{Math.round(aff.value * 100)}% {aff.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      ))}
                      {selectedItem.rarity === 'LEGENDARY' && (
                        <div className="p-3 bg-yellow-950/20 border border-yellow-700/20 rounded-lg text-xs font-mono text-yellow-500 leading-relaxed mt-1">
                          ★ Legendary Passive: {getLegendaryDescription(selectedItem.name)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Equip & Sell Actions */}
                  <div className="border-t border-white/5 pt-5 flex gap-4 mt-2">
                    {selectedItem.isEquipped ? (
                      <button
                        onClick={() => handleUnequipItem(selectedItem.id)}
                        className="flex-1 py-2.5 bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-black border border-yellow-500/40 hover:border-yellow-500 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                      >
                        Unequip
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEquipItem(selectedItem.id)}
                          className="flex-1 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-black border border-emerald-500/40 hover:border-emerald-500 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                        >
                          Equip Gear
                        </button>
                        <button
                          onClick={() => handleDismantleItem(selectedItem.id)}
                          className="px-6 py-2.5 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/40 hover:border-red-600 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                        >
                          Sell Item
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Class Talents */}
              <div className="glass-panel p-6 border-white/5 bg-black/25">
                <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-4 text-neon-cyan">
                  Class Talents
                </h3>
                
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4].map(tier => {
                    const reqLevel = tier * 5;
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
                                onClick={() => handleSelectTalent(t.id)}
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
            </div>
          )}

          {/* 2. PASSIVE TREE TAB */}
          {activeTab === 'tree' && (
            <PassiveSkillTree character={character} onUpdateCharacter={onUpdateCharacter} />
          )}

          {/* 3. MERCHANT SHOP TAB */}
          {activeTab === 'shop' && (
            <div className="flex flex-col gap-6">
              
              {/* Buy and refresh stock panel */}
              <div className="glass-panel p-6 border-white/5 bg-black/25 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider text-neon-cyan">
                      Merchant Gear Purchase
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed m-0 mt-1 uppercase tracking-wider">
                      Stock scales to your active level. stock refreshes automatically after battles.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleRefreshShop}
                    className="px-4 py-2 border border-yellow-500/30 text-yellow-500 text-xs font-display font-bold uppercase tracking-wider rounded hover:bg-yellow-500 hover:text-black transition duration-300 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Stock (10g)
                  </button>
                </div>

                {shopLoading ? (
                  <div className="text-slate-500 italic text-xs py-8 text-center uppercase tracking-widest font-mono">
                    FETCHING STOCK FROM MERCHANT BOARD...
                  </div>
                ) : shopStock.length === 0 ? (
                  <div className="text-slate-500 italic text-xs py-8 text-center">
                    The merchant is out of stock! Try refreshing.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shopStock.map((shopItem: any) => {
                      // Calculate purchase price
                      let price = shopItem.itemLevel * 20;
                      switch (shopItem.rarity) {
                        case 'UNCOMMON': price += 50; break;
                        case 'RARE': price += 150; break;
                        case 'EPIC': price += 450; break;
                        case 'LEGENDARY': price += 1000; break;
                      }

                      return (
                        <div
                          key={shopItem.id}
                          className="p-4 bg-[#090e1a]/85 border border-white/5 rounded-xl flex flex-col justify-between gap-4 hover:border-white/15 transition relative"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="m-0 text-white font-display text-xs tracking-wider leading-snug">{shopItem.name}</h4>
                              <span className="text-[8px] font-mono uppercase font-bold shrink-0" style={{ color: `var(--rarity-${shopItem.rarity.toLowerCase()})` }}>
                                {shopItem.rarity}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Lvl {shopItem.itemLevel} {shopItem.slot}
                            </div>

                            {/* stats preview */}
                            <div className="flex flex-col gap-1 mt-3 text-[10px] font-mono text-slate-400">
                              {shopItem.baseAttack > 0 && <span className="text-emerald-400">+{shopItem.baseAttack} Attack</span>}
                              {shopItem.baseDefense > 0 && <span className="text-blue-400">+{shopItem.baseDefense} Defense</span>}
                              {shopItem.affixes && (typeof shopItem.affixes === 'string' ? JSON.parse(shopItem.affixes) : shopItem.affixes).map((aff: any, i: number) => (
                                <span key={i} className="text-cyan-400/80">+{Math.round(aff.value * 100)}% {aff.type.replace('_', ' ')}</span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleBuyShopItem(shopItem.id, price)}
                            className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black border border-yellow-500/30 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1.5"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            Buy ({price}g)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mystery gambling card */}
              <div className="glass-panel p-6 border-white/5 bg-black/25 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/5 blur-[50px] -z-10" />
                
                <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider text-neon-purple flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 shrink-0 text-neon-purple" />
                  Gheed's Mystery Artifacts (Gambling)
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed m-0 mb-2">
                  Roll the dice for a random item. Mystery artifacts have an index cost scaling with your active character's level: <span className="text-yellow-500 font-bold">{character.level * 40} Gold</span>. Low odds of Epic/Legendary gear.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  {['WEAPON', 'ARMOR', 'ACCESSORY'].map(slot => (
                    <button
                      key={slot}
                      onClick={() => handleGambleItem(slot)}
                      className="p-4 bg-black/40 hover:bg-neon-purple/5 border border-white/5 hover:border-neon-purple/20 rounded-xl flex flex-col items-center justify-between gap-3 text-center transition duration-300"
                    >
                      <span className="text-[10px] font-pixel text-slate-500 tracking-widest">{slot}</span>
                      <span className="text-[18px] font-display font-bold text-white uppercase tracking-wider mt-1">? MYSTERY ?</span>
                      <div className="text-yellow-500 font-mono text-xs font-bold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 shrink-0" />
                        {character.level * 40} Gold
                      </div>
                    </button>
                  ))}
                </div>

                {gambledItem && (
                  <div className="mt-4 p-4 bg-yellow-950/20 border border-yellow-500/20 rounded-xl flex items-center justify-between gap-4 animate-pulse">
                    <div>
                      <span className="text-[9px] font-pixel text-yellow-500 uppercase tracking-widest">[ GAMBLING RESULT ]</span>
                      <h4 className="m-0 text-white font-display text-sm mt-1">{gambledItem.name}</h4>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Slot: {gambledItem.slot} | Rarity:{' '}
                        <span className="font-bold font-mono" style={{ color: `var(--rarity-${gambledItem.rarity.toLowerCase()})` }}>
                          {gambledItem.rarity}
                        </span>
                      </div>
                    </div>
                    <span className="text-2xl">🎉</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 4. SOLO GRIND TAB */}
          {activeTab === 'solo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`glass-panel p-6 border-white/5 bg-black/25 flex flex-col justify-between items-start gap-4 transition ${
                      isUnderlevel ? 'opacity-40 cursor-default' : 'hover:border-white/20'
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-center w-full mb-1">
                        <h4 className="m-0 text-white font-display text-sm tracking-wide">
                          {zone.name.toUpperCase()}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">Zone lvl {zone.level}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed m-0 mt-2">{zone.desc}</p>
                      {isUnderlevel && (
                        <p className="text-[10px] text-red-500 font-display uppercase font-bold mt-2 leading-none">
                          ⚠ RECOMMENDED LEVEL: {zone.level}
                        </p>
                      )}
                    </div>
                    <button
                      disabled={isUnderlevel}
                      onClick={() => onNavigate('solo-arena', { mapLevel: zone.level })}
                      className="px-4 py-2.5 bg-emerald-600/10 disabled:opacity-20 hover:bg-emerald-600 text-emerald-400 hover:text-black border border-emerald-500/20 hover:border-emerald-500 rounded text-xs font-display font-bold uppercase tracking-wider transition w-full"
                    >
                      Launch Autobattle
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. ACTIVE LOBBIES / RAID HOSTING TAB */}
          {activeTab === 'raids' && (
            <div className="flex flex-col gap-6">
              
              {/* Creator screen for Streamers */}
              <div className="glass-panel p-6 border-white/5 bg-black/25">
                <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-4 text-neon-cyan">
                  Streamer Console: Host Lobby
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Set up a custom lobby wave. Viewers can join this page to hop in. When you start the raid, your browser will coordinate the canvas physics and relay states.
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
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-neon-cyan"
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
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-neon-cyan"
                    />
                  </div>
                  <button
                    onClick={handleCreateLobby}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300 shadow-md"
                  >
                    Open Lobby
                  </button>
                </div>
              </div>

              {/* Lobbies browser for Players */}
              <div className="glass-panel p-6 border-white/5 bg-black/25">
                <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-4 text-neon-cyan">
                  Active Lobbies
                </h3>

                {lobbies.length === 0 ? (
                  <div className="text-slate-500 italic text-xs text-center py-8">
                    No active streamer lobbies found. Encourage a streamer to open one, or create one yourself above!
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {lobbies.map((lob: any) => {
                      const isFighting = lob.status === 'FIGHTING';
                      return (
                        <div
                          key={lob.streamerName}
                          className="p-4 bg-[#090e1a]/85 border border-white/5 rounded-xl flex justify-between items-center gap-4 hover:border-white/15 transition"
                        >
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-display font-bold text-white text-xs uppercase">
                                #{lob.streamerName}
                              </span>
                              <a
                                href={`https://twitch.tv/${lob.streamerName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                              >
                                <svg className="w-3.5 h-3.5 fill-current inline" viewBox="0 0 24 24">
                                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                                </svg>
                                <span className="underline">Twitch Profile</span>
                                <ExternalLink size={10} className="inline shrink-0" />
                              </a>
                              <span
                                className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isFighting
                                    ? 'bg-red-950/20 text-red-400 border border-red-900/30'
                                    : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'
                                }`}
                              >
                                {lob.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1.5">
                              Boss: <span className="text-white font-bold">{lob.bossName}</span> (lvl {lob.bossLevel})
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              Joined viewers: <span className="text-cyan-400">{lob.viewers.length}</span>
                            </div>
                          </div>

                          {isFighting ? (
                            <span className="text-[10px] font-mono text-red-500 uppercase font-bold shrink-0 max-w-[120px] text-right">
                              ⚠ RAID IN PROGRESS
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                onNavigate('viewer-lobby', { streamerName: lob.streamerName })
                              }
                              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                            >
                              Join Raid
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. ADMIN DEV TAB */}
          {activeTab === 'admin' && character.user.isAdmin && (
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
                      onClick={handleAdminXp}
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
                      onClick={handleAdminGold}
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
                    onClick={handleSpawnItem}
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
                      onClick={handlePromoteUser}
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
                    onClick={handleResetCharacter}
                    className="w-full py-2 bg-red-950/40 text-red-400 hover:text-white border border-red-900/40 hover:bg-red-600 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300"
                  >
                    Reset Active Profile
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
