import React, { useState, useEffect } from 'react';
import { CharacterVisualizer } from '../components/CharacterVisualizer';
import { PassiveSkillTree } from '../components/PassiveSkillTree';
import { apiFetch } from '../utils/api';
import { CLASSES, calculateCharacterStats, xpToNextLevel } from 'shared';
import { 
  Shield, Sparkles, Heart, Sword, Crosshair,
  ExternalLink, Users, User
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Import sub components
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ClassSwitcher } from '../components/dashboard/ClassSwitcher';
import { GearStash } from '../components/dashboard/GearStash';
import { ClassTalentsTab } from '../components/dashboard/ClassTalentsTab';
import { MerchantShopTab } from '../components/dashboard/MerchantShopTab';
import { AdminPanelTab } from '../components/dashboard/AdminPanelTab';

const raidTiers = [
  { id: 'tier1', name: 'Tier 1: Goblin Camp', bossName: 'Goblin King', level: 1 },
  ...Array.from({ length: 20 }, (_, idx) => {
    const level = (idx + 1) * 5;
    const tierNum = idx + 2;
    let name = `Tier ${tierNum}: Dragon Valley`;
    let bossName = 'Inferno Dragon';
    if (level <= 20) {
      name = `Tier ${tierNum}: Goblin Camp`;
      bossName = 'Goblin King';
    } else if (level <= 40) {
      name = `Tier ${tierNum}: Poison Caves`;
      bossName = 'Slither King';
    } else if (level <= 60) {
      name = `Tier ${tierNum}: Orc Stronghold`;
      bossName = 'Orc Chieftain';
    } else if (level <= 80) {
      name = `Tier ${tierNum}: Lich Tomb`;
      bossName = 'Neon Lich';
    }
    return {
      id: `tier${tierNum}`,
      name,
      bossName,
      level
    };
  })
];

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
  const [activeSection, setActiveSection] = useState<'character' | 'solo' | 'raids'>('character');
  const [activeTab, setActiveTab] = useState<'inventory' | 'talents' | 'tree' | 'shop' | 'admin'>('inventory');
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
  const [selectedRaidTier, setSelectedRaidTier] = useState('tier1');
  const [bossName, setBossName] = useState('Goblin King');
  const [bossLevel, setBossLevel] = useState('1');

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
    if (activeSection === 'raids') {
      fetchLobbies();
      const interval = setInterval(fetchLobbies, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeTab === 'shop' && activeSection === 'character') {
      fetchShopData();
    }
  }, [activeTab, activeSection]);

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
    const match = talentId.match(/^t(\d+)_\d+$/);
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col gap-6">
      
      {/* 0. CORE GAMEPLAY MODES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        <button
          onClick={() => setActiveSection('character')}
          className={`glass-panel p-5 border text-left flex items-center justify-between transition-all duration-300 ${
            activeSection === 'character'
              ? 'border-purple-500/80 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.25)] text-white scale-[1.01]'
              : 'border-white/5 bg-black/20 text-slate-400 hover:border-purple-500/40 hover:bg-black/30 hover:text-white'
          }`}
        >
          <div className="flex flex-col gap-1 pr-4">
            <span className={`font-display text-sm font-black uppercase tracking-wider ${activeSection === 'character' ? 'text-neon-purple animate-pulse' : 'text-slate-300'}`}>
              Character
            </span>
            <span className="text-[11px] text-slate-400 leading-normal font-mono">
              Manage gear, passive tree, and talents
            </span>
          </div>
          <User className={`w-8 h-8 shrink-0 ${activeSection === 'character' ? 'text-neon-purple' : 'text-slate-500'}`} />
        </button>

        <button
          onClick={() => setActiveSection('solo')}
          className={`glass-panel p-5 border text-left flex items-center justify-between transition-all duration-300 ${
            activeSection === 'solo'
              ? 'border-cyan-500/80 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.25)] text-white scale-[1.01]'
              : 'border-white/5 bg-black/20 text-slate-400 hover:border-cyan-500/40 hover:bg-black/30 hover:text-white'
          }`}
        >
          <div className="flex flex-col gap-1 pr-4">
            <span className={`font-display text-sm font-black uppercase tracking-wider ${activeSection === 'solo' ? 'text-neon-cyan animate-pulse' : 'text-slate-300'}`}>
              Solo Arena
            </span>
            <span className="text-[11px] text-slate-400 leading-normal font-mono">
              Grind solo to get XP and loot on your own
            </span>
          </div>
          <Sword className={`w-8 h-8 shrink-0 ${activeSection === 'solo' ? 'text-neon-cyan' : 'text-slate-500'}`} />
        </button>

        <button
          onClick={() => setActiveSection('raids')}
          className={`glass-panel p-5 border text-left flex items-center justify-between transition-all duration-300 ${
            activeSection === 'raids'
              ? 'border-fuchsia-500/80 bg-fuchsia-950/20 shadow-[0_0_20px_rgba(217,70,239,0.25)] text-white scale-[1.01]'
              : 'border-white/5 bg-black/20 text-slate-400 hover:border-fuchsia-500/40 hover:bg-black/30 hover:text-white'
          }`}
        >
          <div className="flex flex-col gap-1 pr-4">
            <span className={`font-display text-sm font-black uppercase tracking-wider ${activeSection === 'raids' ? 'text-neon-magenta animate-pulse' : 'text-slate-300'}`}>
              Lobbies & Raids
            </span>
            <span className="text-[11px] text-slate-400 leading-normal font-mono">
              Host/join viewer raids to battle epic bosses
            </span>
          </div>
          <Users className={`w-8 h-8 shrink-0 ${activeSection === 'raids' ? 'text-neon-magenta' : 'text-slate-500'}`} />
        </button>
      </div>

      {/* 1. TOP HEADER BANNER */}
      <DashboardHeader
        character={character}
        shopGold={shopGold}
        inventoryLength={inventory.length}
        xpPercent={xpPercent}
        xpNeeded={xpNeeded}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* 2. MAIN LAYOUT GRID */}
      {activeSection === 'character' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Character Emblem & Stat Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Emblem wireframe */}
            <div className="glass-panel p-6 border-white/5 bg-[#090e1a]/95 flex flex-col items-center shadow-lg relative">
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
            <ClassSwitcher character={character} onSelectClass={handleSelectClass} />

          </div>

          {/* RIGHT COLUMN: Interactive Tabs & Panel (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Sub Tab Navigation */}
            <div className="flex border-b border-white/5 gap-2 select-none overflow-x-auto pb-1">
              {[
                { id: 'inventory', label: 'Gear & Stash' },
                { id: 'talents', label: 'Class Talents' },
                { id: 'tree', label: 'Skill Tree' },
                { id: 'shop', label: 'Merchant Shop' },
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
              <GearStash
                equipped={equipped}
                inventory={inventory}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                onEquipItem={handleEquipItem}
                onUnequipItem={handleUnequipItem}
                onDismantleItem={handleDismantleItem}
              />
            )}

            {/* Class Talents Tab */}
            {activeTab === 'talents' && (
              <ClassTalentsTab
                character={character}
                onSelectTalent={handleSelectTalent}
              />
            )}

            {/* 2. PASSIVE TREE TAB */}
            {activeTab === 'tree' && (
              <PassiveSkillTree character={character} onUpdateCharacter={onUpdateCharacter} />
            )}

            {/* 3. MERCHANT SHOP TAB */}
            {activeTab === 'shop' && (
              <MerchantShopTab
                character={character}
                shopStock={shopStock}
                shopLoading={shopLoading}
                gambledItem={gambledItem}
                onRefreshShop={handleRefreshShop}
                onBuyShopItem={handleBuyShopItem}
                onGambleItem={handleGambleItem}
              />
            )}

            {/* 6. ADMIN DEV TAB */}
            {activeTab === 'admin' && character.user.isAdmin && (
              <AdminPanelTab
                adminXp={adminXp}
                setAdminXp={setAdminXp}
                adminGold={adminGold}
                setAdminGold={setAdminGold}
                spawnSlot={spawnSlot}
                setSpawnSlot={setSpawnSlot}
                spawnRarity={spawnRarity}
                setSpawnRarity={setSpawnRarity}
                spawnLevel={spawnLevel}
                setSpawnLevel={setSpawnLevel}
                promoteName={promoteName}
                setPromoteName={setPromoteName}
                onAdminXp={handleAdminXp}
                onAdminGold={handleAdminGold}
                onSpawnItem={handleSpawnItem}
                onResetCharacter={handleResetCharacter}
                onPromoteUser={handlePromoteUser}
              />
            )}

          </div>
        </div>
      ) : activeSection === 'solo' ? (
        <div className="w-full animate-scaleUp">
          <div className="glass-panel p-6 border-white/5 bg-black/25 flex flex-col gap-4">
            <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-2 text-neon-cyan">
              Solo Grind Zones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Forest of Trials', level: 1, desc: 'A dense wood where goblins roam. Ideal for starters.' },
                { name: 'Neon Caves', level: 15, desc: 'Glowing crystal tunnels with swift venomous serpents.' },
                { name: 'Obsidian Ruins', level: 35, desc: 'Cursed obsidian pillars and heavy orc raiders.' },
                { name: 'Lich Crypt', level: 55, desc: 'A dark, cold maze guarded by ancient skeleton acolyths.' },
                { name: 'Volcanic Caldera', level: 75, desc: 'Lava flows, magma giants, and legendary fire dragons.' },
                { name: 'Abyssal Maw', level: 90, desc: 'The final frontier. Face the strongest challenges here.' }
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
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-scaleUp">
          
          {/* Creator screen for Streamers */}
          <div className="glass-panel p-6 border-white/5 bg-black/25">
            <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider mb-4 text-neon-cyan">
              Streamer Console: Host Lobby
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Set up a custom lobby wave. Viewers can join this page to hop in. When you start the raid, your browser will coordinate the canvas physics and relay states.
            </p>

            <div className="flex flex-wrap gap-4 items-end mb-6">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[10px] font-display text-slate-400 uppercase tracking-wide mb-1.5">
                  Select Raid Challenge Tier
                </label>
                <select
                  value={selectedRaidTier}
                  onChange={e => {
                    const tierId = e.target.value;
                    setSelectedRaidTier(tierId);
                    const tier = raidTiers.find(t => t.id === tierId);
                    if (tier) {
                      setBossName(tier.bossName);
                      setBossLevel(String(tier.level));
                    }
                  }}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
                >
                  {raidTiers.map(tier => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} (Lvl {tier.level} - {tier.bossName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-44">
                <label className="block text-[10px] font-display text-slate-400 uppercase tracking-wide mb-1.5">
                  Raid Boss Target
                </label>
                <div className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded text-xs text-slate-300 font-bold font-mono">
                  {bossName} (Lvl {bossLevel})
                </div>
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
    </div>
  );
};
