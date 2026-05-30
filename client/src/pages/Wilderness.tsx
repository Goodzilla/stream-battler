import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useUI } from '../contexts/UIContext';
import { calculateCharacterStats, CLASSES } from 'shared';
import { soundManager } from '../game/soundManager';
import { getDistance, lerp } from '../game/physics';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { drawPixelSprite, drawProceduralBackground } from '../game/sprites';
import {
  updateUnitPhysics,
  performBasicAttack,
  castActiveSkill,
  updateVisuals
} from '../game/combatEngine';
import type {
  CombatUnit,
  FloatingText,
  Particle as VisualParticle
} from '../game/combatEngine';

interface WildernessProps {
  onBackToDashboard: () => void;
}

// Background theme configuration for the MMO wilderness
const WILDERNESS_ARENA_CONFIG = {
  name: 'Neon Wilderness',
  level: 15,
  theme: 'FOREST' as const,
  bgColor: '#04060d', // dark cyber space
  detailColor: '#111827', // grid lines and dots
  enemySprite: 'GOBLIN_SCOUT',
  enemyNames: ['Slime'],
  desc: 'Persistent MMO cooperative map.'
};

const getProjectileType = (name: string, spriteOrClass?: string): 'ARROW' | 'FIRE' | 'POISON' | 'SPELL' => {
  const n = name.toLowerCase();
  const s = spriteOrClass ? spriteOrClass.toLowerCase() : '';
  if (n.includes('archer') || n.includes('bow') || s.includes('ranger') || s.includes('archer')) {
    return 'ARROW';
  }
  if (n.includes('dragon') || n.includes('drake') || n.includes('sovereign') || n.includes('wyvern') || n.includes('hatchling') ||
      s.includes('dragon') || s.includes('drake') || s.includes('wyvern') || s.includes('hatchling')) {
    return 'FIRE';
  }
  if (n.includes('viper') || n.includes('adder') || n.includes('cobra') || n.includes('snake') || n.includes('mamba') ||
      s.includes('viper') || s.includes('adder') || s.includes('cobra') || s.includes('snake') || s.includes('mamba')) {
    return 'POISON';
  }
  return 'SPELL';
};

export const Wilderness: React.FC<WildernessProps> = ({ onBackToDashboard }) => {
  const { character } = useAuth();
  const { socket } = useSocket();
  const { showConfirm } = useUI();
  
  const characterRef = useRef(character);
  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  const [mySession, setMySession] = useState<any | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [reviveTimer, setReviveTimer] = useState(0);
  const [wildernessChat, setWildernessChat] = useState<Array<{ id: string; text: string; color: string }>>([]);
  const [lootAlert, setLootAlert] = useState<{ text: string; subText?: string; life: number } | null>(null);

  // Local state references for coordinates interpolation
  const stateRef = useRef<{
    player: CombatUnit | null;
    otherPlayers: Record<string, CombatUnit>;
    monsters: CombatUnit[];
    particles: VisualParticle[];
    floatingTexts: FloatingText[];
    projectiles: any[];
    shakeTimer: number;
    shakeIntensity: number;
  }>({
    player: null,
    otherPlayers: {},
    monsters: [],
    particles: [],
    floatingTexts: [],
    projectiles: [],
    shakeTimer: 0,
    shakeIntensity: 0
  });


  // 1. Initialize Battle Character Representation
  const initPlayerUnit = (): CombatUnit => {
    const char = characterRef.current;
    const classConfig = CLASSES[char.class];
    const selectedTalents: string[] = JSON.parse(char.talents || '[]');
    let baseCd = classConfig.activeSkill.cooldown;

    // Apply CDR talents
    if (char.class === 'WARRIOR') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t5_2')) baseCd += 2.0;
      if (selectedTalents.includes('t6_2')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_1')) baseCd -= 3.0;
    } else if (char.class === 'MAGE') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t6_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t10_2')) baseCd -= 2.5;
    } else if (char.class === 'CLERIC') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t5_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.0;
    } else if (char.class === 'ROGUE') {
      if (selectedTalents.includes('t2_2')) baseCd -= 1.5;
      if (selectedTalents.includes('t6_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.0;
    } else if (char.class === 'RANGER') {
      if (selectedTalents.includes('t1_2')) baseCd -= 1.5;
      if (selectedTalents.includes('t5_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t9_1')) baseCd -= 3.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 4.0;
    }

    const equippedItems = char.items.filter((item: any) => item.isEquipped);
    const charStats = calculateCharacterStats(
      char.class,
      char.level,
      JSON.parse(char.talents || '[]'),
      JSON.parse(char.passives || '[]'),
      equippedItems
    );

    return {
      id: char.userId,
      isPlayer: true,
      name: char.user.displayName,
      x: 100 + Math.random() * 80,
      y: 150 + Math.random() * 300,
      maxHp: charStats.maxHp,
      hp: charStats.maxHp,
      speed: charStats.moveSpeed,
      attackPower: charStats.attackPower,
      critChance: charStats.critChance,
      critMult: charStats.critMult,
      atkSpeed: charStats.atkSpeed,
      attackRange: char.class === 'RANGER' ? 220 : (char.class === 'MAGE' ? 180 : 40),
      color: classConfig.color,
      classType: char.class,
      atkTimer: 0,
      skillTimer: 0,
      activeSkillCd: Math.max(1, baseCd * (1 - charStats.cdr)),
      stunTimer: 0,
      isHealer: char.class === 'CLERIC',
      defense: charStats.defense,
      lifesteal: charStats.lifesteal,
      reflect: charStats.reflect,
      fireRes: charStats.fireRes,
      coldRes: charStats.coldRes,
      poisonRes: charStats.poisonRes,
      physRes: charStats.physRes,
      selectedTalents
    };
  };

  const addExplosion = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 4;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color,
        size: 1.5 + Math.random() * 2.5,
        alpha: 1.0,
        life: 40 + Math.random() * 30
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string, isCrit = false) => {
    stateRef.current.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 50,
      isCrit
    });
  };

  // 2. Setup Socket Listeners
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join-wilderness', { userId: characterRef.current.userId });

    // Initial state
    socket.on('wilderness-init', ({ players, monsters }) => {
      const s = stateRef.current;
      s.player = initPlayerUnit();
      
      // Load other players
      s.otherPlayers = {};
      players.forEach((p: any) => {
        if (p.userId !== characterRef.current.userId) {
          s.otherPlayers[p.userId] = {
            id: p.userId,
            isPlayer: true,
            name: p.displayName,
            x: p.x,
            y: p.y,
            hp: p.hp,
            maxHp: p.maxHp,
            color: p.color,
            classType: p.charClass,
            speed: p.speed,
            attackPower: p.attackPower,
            defense: p.defense,
            attackRange: p.attackRange,
            atkTimer: 0,
            skillTimer: 0,
            activeSkillCd: 10,
            stunTimer: 0,
            atkSpeed: p.atkSpeed || 1.0,
            critChance: p.critChance || 0.05,
            critMult: p.critMult || 1.5
          };
        }
      });

      // Load monsters
      s.monsters = monsters.map((m: any) => ({
        id: m.id,
        isPlayer: false,
        name: m.name,
        x: m.x,
        y: m.y,
        hp: m.hp,
        maxHp: m.maxHp,
        speed: m.speed,
        attackPower: m.attackPower,
        attackRange: m.attackRange,
        atkSpeed: m.atkSpeed,
        atkTimer: 0,
        skillTimer: 0,
        activeSkillCd: 999,
        stunTimer: 0,
        color: m.color,
        spriteType: m.spriteType,
        critChance: 0.05,
        critMult: 1.5
      }));
    });

    // Tick updates (monsters movement and lists sync)
    socket.on('wilderness-update', ({ players, monsters }) => {
      const s = stateRef.current;

      // Update monsters coordinates
      monsters.forEach((mon: any) => {
        const existing = s.monsters.find(m => m.id === mon.id);
        if (existing) {
          // Interpolation coordinates targets
          (existing as any).tx = mon.x;
          (existing as any).ty = mon.y;
          existing.hp = mon.hp;
          existing.maxHp = mon.maxHp;
        } else {
          // Spawning new monster
          s.monsters.push({
            id: mon.id,
            isPlayer: false,
            name: mon.name,
            x: mon.x,
            y: mon.y,
            hp: mon.hp,
            maxHp: mon.maxHp,
            speed: mon.speed,
            attackPower: mon.attackPower,
            attackRange: mon.attackRange,
            atkSpeed: mon.atkSpeed,
            atkTimer: 0,
            skillTimer: 0,
            activeSkillCd: 999,
            stunTimer: 0,
            color: mon.color,
            spriteType: mon.spriteType,
            critChance: 0.05,
            critMult: 1.5
          });
        }
      });
      // Remove dead monsters
      const serverMonsterIds = new Set(monsters.map((m: any) => m.id));
      s.monsters = s.monsters.filter(m => serverMonsterIds.has(m.id));

      // Update other players roster
      players.forEach((p: any) => {
        if (p.userId === characterRef.current.userId) return;

        const existing = s.otherPlayers[p.userId];
        if (existing) {
          (existing as any).tx = p.x;
          (existing as any).ty = p.y;
          existing.hp = p.hp;
          existing.maxHp = p.maxHp;
        } else {
          s.otherPlayers[p.userId] = {
            id: p.userId,
            isPlayer: true,
            name: p.displayName,
            x: p.x,
            y: p.y,
            hp: p.hp,
            maxHp: p.maxHp,
            color: p.color,
            classType: p.charClass,
            speed: p.speed,
            attackPower: p.attackPower,
            defense: p.defense,
            attackRange: p.attackRange,
            atkTimer: 0,
            skillTimer: 0,
            activeSkillCd: 10,
            stunTimer: 0,
            atkSpeed: p.atkSpeed || 1.0,
            critChance: p.critChance || 0.05,
            critMult: p.critMult || 1.5
          };
        }
      });
      // Clean up players who left
      const serverPlayerIds = new Set(players.map((p: any) => p.userId));
      Object.keys(s.otherPlayers).forEach(pId => {
        if (!serverPlayerIds.has(pId)) {
          delete s.otherPlayers[pId];
        }
      });
    });

    // Roster announcements
    socket.on('wilderness-chat-announcement', ({ message, color }) => {
      setWildernessChat(prev => [...prev.slice(-30), { id: String(Math.random()), text: message, color }]);
    });

    // Coordinate sync relays
    socket.on('wilderness-player-synced', ({ userId, x, y, hp, maxHp }) => {
      const p = stateRef.current.otherPlayers[userId];
      if (p) {
        (p as any).tx = x;
        (p as any).ty = y;
        p.hp = hp;
        p.maxHp = maxHp;
      }
    });

    // Damage updates
    socket.on('wilderness-player-damaged-sync', ({ userId, damage, newHp }) => {
      const s = stateRef.current;
      const target = userId === characterRef.current.userId ? s.player : s.otherPlayers[userId];
      if (target) {
        target.hp = newHp;
        target.flashTimer = 0.1;
        target.flashColor = '#ffffff';
        addFloatingText(target.x, target.y - 20, `${damage}`, '#ff3b30');
        addExplosion(target.x, target.y, '#ffffff', 8);
      }
    });

    // Heal updates
    socket.on('wilderness-player-healed-sync', ({ targetUserId, amount, newHp }) => {
      const s = stateRef.current;
      const target = targetUserId === characterRef.current.userId ? s.player : s.otherPlayers[targetUserId];
      if (target) {
        target.hp = newHp;
        target.flashTimer = 0.15;
        target.flashColor = '#ffcc00';
        addFloatingText(target.x, target.y - 12, `+${amount}`, '#ffcc00');
        addExplosion(target.x, target.y, '#ffcc00', 8);
      }
    });

    // Monster hits updates
    socket.on('monster-damaged-sync', ({ monsterId, hp, damage, isCrit, attackerId }) => {
      const s = stateRef.current;
      const mon = s.monsters.find(m => m.id === monsterId);
      const attacker = attackerId === characterRef.current.userId ? s.player : s.otherPlayers[attackerId];

      if (mon) {
        mon.hp = hp;
        mon.flashTimer = 0.08;
        mon.flashColor = '#ff3b30';
        
        if (isCrit) {
          s.shakeTimer = 0.15;
          s.shakeIntensity = 6;
        }

        // Draw projectile trajectory
        if (attacker) {
          const isRanged = attacker.attackRange > 50;
          if (isRanged) {
            const speed = 400; // placeholder
            const type = getProjectileType(mon.name, mon.spriteType || attacker.classType);
            s.projectiles.push({
              x: attacker.x,
              y: attacker.y,
              tx: mon.x,
              ty: mon.y,
              speed: speed,
              color: attacker.color,
              type: type,
              life: 0.8,
              targetId: mon.id
            });
          } else {
            // Melee flash line
            s.projectiles.push({
              x: attacker.x,
              y: attacker.y,
              tx: mon.x,
              ty: mon.y,
              color: attacker.color,
              life: 0.15,
              type: 'MELEE'
            });
          }
        }

        addFloatingText(mon.x + (Math.random() * 30 - 15), mon.y - 15, `${damage}`, isCrit ? '#ff9500' : '#ffffff', isCrit);
        addExplosion(mon.x, mon.y, attacker?.color || '#ffffff', 8);
      }
    });

    // Monster death updates
    socket.on('monster-died-sync', ({ monsterId }) => {
      const s = stateRef.current;
      const mon = s.monsters.find(m => m.id === monsterId);
      if (mon) {
        addExplosion(mon.x, mon.y, '#ff3b30', 25);
        s.monsters = s.monsters.filter(m => m.id !== monsterId);
        soundManager.playVictory();
      }
    });

    // Loot awards
    socket.on('wilderness-loot-reward', ({ monsterName, xpGained, goldGained, itemDropped, inventoryFull }) => {
      soundManager.playVictory();
      
      let text = `Slain: ${monsterName}!`;
      let subText = `+${xpGained} XP  |  +${goldGained} Gold`;

      if (itemDropped) {
        text = `💎 LOOT FOUND: ${itemDropped.name}! 💎`;
        subText = `Check your Inventory!  (+${xpGained} XP | +${goldGained} Gold)`;
      } else if (inventoryFull) {
        subText += `  (Inventory Full! No items dropped)`;
      }

      setLootAlert({ text, subText, life: 3.5 });
    });

    // Session updates
    socket.on('wilderness-session-update', (sessions: any[]) => {
      const me = sessions.find((s: any) => s.userId === characterRef.current.userId);
      if (me) {
        setMySession(me);
      }
    });

    return () => {
      socket.emit('leave-wilderness', { userId: characterRef.current.userId });
      socket.off('wilderness-init');
      socket.off('wilderness-update');
      socket.off('wilderness-chat-announcement');
      socket.off('wilderness-player-synced');
      socket.off('wilderness-player-damaged-sync');
      socket.off('wilderness-player-healed-sync');
      socket.off('monster-damaged-sync');
      socket.off('monster-died-sync');
      socket.off('wilderness-loot-reward');
      socket.off('wilderness-session-update');
      soundManager.stopMusic();
    };
  }, [socket]);

  // Graveyard revive tick
  useEffect(() => {
    if (reviveTimer <= 0) return;
    const interval = setInterval(() => {
      setReviveTimer(t => {
        if (t <= 1) {
          // Revive
          const s = stateRef.current;
          if (s.player) {
            s.player.hp = s.player.maxHp;
            s.player.x = 100 + Math.random() * 80; // Respawn at spawn point on left
            s.player.y = 150 + Math.random() * 300;
            
            socket?.emit('sync-wilderness-player', {
              userId: characterRef.current.userId,
              x: s.player.x,
              y: s.player.y,
              hp: s.player.hp,
              maxHp: s.player.maxHp
            });

            socket?.emit('wilderness-chat-announcement', {
              message: `${characterRef.current.user.displayName} resurrected at the portal gates.`,
              color: '#38bdf8'
            });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reviveTimer, socket]);

  // 3. Gameplay Canvas Render and Physics update loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const s = stateRef.current;

      // Tick screen shakes
      if (s.shakeTimer > 0) {
        s.shakeTimer -= dt;
      }

      // Tick loot alert life
      setLootAlert(alert => {
        if (!alert) return null;
        if (alert.life <= dt) return null;
        return { ...alert, life: alert.life - dt };
      });

      ctx.save();
      if (s.shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * s.shakeIntensity;
        const dy = (Math.random() - 0.5) * s.shakeIntensity;
        ctx.translate(dx, dy);
      }

      // Draw background
      drawProceduralBackground(ctx, canvas.width, canvas.height, WILDERNESS_ARENA_CONFIG);

      // Draw Graveyard Gateway Zone visual indicators on the left (e.g. blue neon portal circle)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(80, 300, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.beginPath();
      ctx.arc(80, 300, 68, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PORTAL GATEWAY', 80, 300);

      // Interpolate other players positions
      Object.values(s.otherPlayers).forEach(p => {
        if ((p as any).tx !== undefined && (p as any).ty !== undefined) {
          p.x = lerp(p.x, (p as any).tx, 0.18);
          p.y = lerp(p.y, (p as any).ty, 0.18);
        }
      });

      // Interpolate monsters positions
      s.monsters.forEach(m => {
        if ((m as any).tx !== undefined && (m as any).ty !== undefined) {
          m.x = lerp(m.x, (m as any).tx, 0.18);
          m.y = lerp(m.y, (m as any).ty, 0.18);
        }
      });

      // A. TICK AND AUTO-COMBAT DECISIONS FOR OUR PLAYER
      if (s.player && s.player.hp > 0 && reviveTimer === 0) {
        const p = s.player;

        // Reduce local visual flash timers
        if (p.flashTimer && p.flashTimer > 0) p.flashTimer -= dt;
        if (p.atkTimer > 0) p.atkTimer -= dt;
        if (p.skillTimer > 0) p.skillTimer -= dt;

        // Auto combat target logic: Find nearest living monster
        let targetMon: CombatUnit | null = null;
        let minDist = 99999;
        
        s.monsters.forEach(m => {
          if (m.hp <= 0) return;
          const dist = getDistance(p, m);
          if (dist < minDist) {
            minDist = dist;
            targetMon = m;
          }
        });

        if (targetMon) {
          const tm = targetMon as CombatUnit;
          const dist = getDistance(p, tm);

          if (dist <= p.attackRange) {
            // Perform Attack on Cooldown
            if (p.atkTimer <= 0) {
              const dummyRecap = { shakeTimer: s.shakeTimer, shakeIntensity: s.shakeIntensity };
              const dummyProjList: any[] = [];
              
              // Run local calculations
              performBasicAttack(
                p,
                tm,
                dt,
                dummyRecap,
                dummyProjList,
                s.floatingTexts,
                s.particles,
                0.1
              );

              // Update shake
              s.shakeTimer = dummyRecap.shakeTimer;
              s.shakeIntensity = dummyRecap.shakeIntensity;

              // Extract last calculated hit damage to report to server
              const lastFloat = s.floatingTexts[s.floatingTexts.length - 1];
              if (lastFloat) {
                const dmg = parseInt(lastFloat.text, 10) || 1;
                socket?.emit('damage-monster', {
                  userId: character.userId,
                  monsterId: tm.id,
                  damage: dmg,
                  isCrit: lastFloat.isCrit || false
                });
              }
            }

            // Perform Skills on Cooldown
            if (p.skillTimer <= 0) {
              const dummyRecap = { shakeTimer: s.shakeTimer, shakeIntensity: s.shakeIntensity };
              const dummyProjList: any[] = [];

              // Gather Wilderness Allies and Enemies
              const alliesList = [p, ...Object.values(s.otherPlayers).filter(o => o.hp > 0)];
              const enemiesList = s.monsters.filter(m => m.hp > 0);

              // Capture allies initial HPs to check for Cleric heals
              const initialHps = alliesList.map(a => ({ id: a.id, hp: a.hp }));

              castActiveSkill(
                p,
                tm,
                alliesList,
                enemiesList,
                dummyRecap,
                dummyProjList,
                s.floatingTexts,
                s.particles,
                0.1
              );

              s.shakeTimer = dummyRecap.shakeTimer;
              s.shakeIntensity = dummyRecap.shakeIntensity;

              // Check if any heals were cast and relay them
              alliesList.forEach(a => {
                const prev = initialHps.find(h => h.id === a.id);
                if (prev && a.hp > prev.hp) {
                  const amount = a.hp - prev.hp;
                  socket?.emit('wilderness-player-healed', {
                    targetUserId: a.id,
                    healerUserId: character.userId,
                    amount,
                    newHp: a.hp
                  });
                }
              });

              // Extract potential skill damage hits on target and relay them
              const lastFloat = s.floatingTexts[s.floatingTexts.length - 1];
              if (lastFloat && !lastFloat.text.startsWith('+') && !lastFloat.text.includes('Reflect') && !lastFloat.text.includes('RESET')) {
                const dmg = parseInt(lastFloat.text, 10) || 5;
                socket?.emit('damage-monster', {
                  userId: character.userId,
                  monsterId: tm.id,
                  damage: dmg,
                  isCrit: true
                });
              }
            }
          } else {
            // Move character towards target
            updateUnitPhysics(p, tm, [], dt, canvas.width, canvas.height);
          }
        } else {
          // No monsters, wander towards center spawn area
          const spawnLoc = { x: 250, y: 300 };
          if (getDistance(p, spawnLoc) > 100) {
            updateUnitPhysics(p, spawnLoc, [], dt, canvas.width, canvas.height);
          }
        }

        // B. TICK MONSTER MELEE ATTACKS ON OUR LOCAL PLAYER
        s.monsters.forEach(m => {
          if (m.hp <= 0) return;
          const dist = getDistance(m, p);
          if (dist <= m.attackRange) {
            if (m.atkTimer === undefined) m.atkTimer = 0;
            if (m.atkTimer > 0) {
              m.atkTimer -= dt;
            } else {
              // Execute hit on our player
              const dummyRecap = { shakeTimer: s.shakeTimer, shakeIntensity: s.shakeIntensity };
              const dummyProjList: any[] = [];

              performBasicAttack(
                m,
                p,
                dt,
                dummyRecap,
                dummyProjList,
                s.floatingTexts,
                s.particles,
                0.1
              );

              m.atkTimer = 1.0 / m.atkSpeed;

              // Emit update to server
              const lastFloat = s.floatingTexts[s.floatingTexts.length - 1];
              if (lastFloat) {
                const dmg = parseInt(lastFloat.text, 10) || 1;
                socket?.emit('wilderness-player-damaged', {
                  userId: character.userId,
                  damage: dmg,
                  newHp: p.hp
                });
              }
            }
          }
        });

        // Sync coordinates periodically to other players
        if (Math.random() < 0.15) {
          socket?.emit('sync-wilderness-player', {
            userId: character.userId,
            x: p.x,
            y: p.y,
            hp: p.hp,
            maxHp: p.maxHp
          });
        }

        // C. HANDLE PLAYER DEATH
        if (p.hp <= 0) {
          p.hp = 0;
          setReviveTimer(6);
          soundManager.playDefeat();
          socket?.emit('wilderness-player-damaged', {
            userId: character.userId,
            damage: 0,
            newHp: 0
          });
        }
      }

      // D. DRAW PLAYERS
      // Other players
      Object.values(s.otherPlayers).forEach(op => {
        if (op.hp <= 0) {
          // Draw tombstone
          ctx.fillStyle = '#64748b';
          ctx.fillRect(op.x - 4, op.y - 12, 8, 16);
          ctx.fillRect(op.x - 10, op.y - 8, 20, 4);
          ctx.fillStyle = '#1e293b';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('RIP', op.x, op.y);
          return;
        }

        if (op.flashTimer && op.flashTimer > 0) op.flashTimer -= dt;
        const opFlash = (op.flashTimer && op.flashTimer > 0) ? op.flashColor : undefined;

        drawPixelSprite(ctx, op.x, op.y, op.classType || 'WARRIOR', 2.5, false, op.color, opFlash);

        // Name and Health bar
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px font-display, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(op.name, op.x, op.y - 26);

        const bx = op.x - 12;
        const by = op.y - 20;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx, by, 24, 3);
        ctx.fillStyle = '#eab308'; // ally health
        ctx.fillRect(bx, by, 24 * (op.hp / op.maxHp), 3);
      });

      // Our player
      if (s.player) {
        const p = s.player;
        if (p.hp <= 0) {
          // Tombstone
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(p.x - 5, p.y - 14, 10, 20);
          ctx.fillRect(p.x - 12, p.y - 9, 24, 5);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('RIP', p.x, p.y - 2);
        } else {
          const pFlash = (p.flashTimer && p.flashTimer > 0) ? p.flashColor : undefined;
          drawPixelSprite(ctx, p.x, p.y, p.classType || 'WARRIOR', 2.8, false, p.color, pFlash);

          // Name and Health
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px font-display, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.name, p.x, p.y - 28);

          const bx = p.x - 15;
          const by = p.y - 22;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(bx, by, 30, 4);
          ctx.fillStyle = '#22c55e'; // player health green
          ctx.fillRect(bx, by, 30 * (p.hp / p.maxHp), 4);
        }
      }

      // E. DRAW MONSTERS
      s.monsters.forEach(m => {
        if (m.hp <= 0) return;
        
        if (m.flashTimer && m.flashTimer > 0) m.flashTimer -= dt;
        const mFlash = (m.flashTimer && m.flashTimer > 0) ? m.flashColor : undefined;

        const isBoss = m.name.includes('BOSS');
        const scale = isBoss ? 5.0 : 2.5;

        drawPixelSprite(ctx, m.x, m.y, m.spriteType || 'GOBLIN_SCOUT', scale, true, m.color, mFlash);

        // Name and Health
        ctx.fillStyle = m.color;
        ctx.font = isBoss ? 'bold 10px Orbitron, sans-serif' : '8px font-display, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.name, m.x, m.y - (isBoss ? 45 : 24));

        const barW = isBoss ? 90 : 22;
        const bx = m.x - barW / 2;
        const by = m.y - (isBoss ? 35 : 18);
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx, by, barW, 3);
        ctx.fillStyle = '#ef4444'; // monster red health
        ctx.fillRect(bx, by, barW * (m.hp / m.maxHp), 3);
      });

      // F. RENDER PROJECTILES
      s.projectiles = s.projectiles.filter(p => {
        if (p.type === 'MELEE') {
          // Draw melee slash trace
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.tx, p.ty);
          ctx.stroke();
          p.life -= dt;
          return p.life > 0;
        }

        // For ranged projectiles
        const mon = s.monsters.find(m => m.id === p.targetId);
        if (mon) {
          p.tx = mon.x;
          p.ty = mon.y;
        }

        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
          addExplosion(p.tx, p.ty, p.color, 8);
          return false;
        }

        const angle = Math.atan2(dy, dx);
        const projectileSpeed = p.speed * dt;
        p.x += Math.cos(angle) * projectileSpeed;
        p.y += Math.sin(angle) * projectileSpeed;
        p.life -= dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        if (p.type === 'ARROW') {
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(3, 0);
          ctx.stroke();
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.moveTo(3, -2);
          ctx.lineTo(7, 0);
          ctx.lineTo(3, 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        return p.life > 0;
      });

      // G. UPDATE AND RENDER PARTICLES AND TEXTS
      updateVisuals([], s.floatingTexts, s.particles, dt);

      s.particles = s.particles.filter(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return p.life > 0 && p.alpha > 0;
      });
      ctx.globalAlpha = 1.0;

      s.floatingTexts = s.floatingTexts.filter(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = ft.isCrit ? 'bold 11px Orbitron, sans-serif' : '700 9px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        return ft.life > 0;
      });

      ctx.restore(); // Restore shake offset

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    soundManager.startMusic();

    return () => {
      cancelAnimationFrame(animId);
      soundManager.stopMusic();
    };
  }, [reviveTimer, socket]);

  const handleReturnToTown = () => {
    if (mySession && (mySession.goldAccumulated > 0 || mySession.xpAccumulated > 0 || mySession.itemsAccumulated.length > 0)) {
      const itemsList = mySession.itemsAccumulated.map((i: any) => i.name).join(', ');
      const itemsSummary = mySession.itemsAccumulated.length > 0
        ? `\nPending Items: ${mySession.itemsAccumulated.length} (${itemsList})`
        : '';
      const message = `Are you sure you want to leave the Neon Wilderness?\n\nYou will claim:\nGold: +${mySession.goldAccumulated}\nXP: +${mySession.xpAccumulated}${itemsSummary}`;
      
      showConfirm(
        message,
        () => {
          socket?.emit('leave-wilderness', { userId: characterRef.current.userId });
          onBackToDashboard();
        },
        'LEAVE WILDERNESS'
      );
    } else {
      socket?.emit('leave-wilderness', { userId: characterRef.current.userId });
      onBackToDashboard();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#04060d] z-20 flex flex-col overflow-hidden select-none font-display">
      {/* Header bar */}
      <div className="h-14 border-b border-white/5 bg-[#090e1a] px-6 flex items-center justify-between z-30 shrink-0">
        <span className="text-xs text-slate-400 font-semibold tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          COOPERATIVE ZONE: NEON WILDERNESS
        </span>

        <button
          onClick={handleReturnToTown}
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-xl bg-black/35 cursor-pointer"
        >
          <ArrowLeft size={12} />
          Return to Town
        </button>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 w-full relative flex items-center justify-center p-4 bg-[#030407] overflow-hidden">
        <canvas
          ref={canvasRef}
          width="1200"
          height="600"
          className="w-full h-full max-w-full max-h-full object-contain block bg-[#030407] border border-white/[0.03] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.7)]"
        />

        {/* GRAVEYARD RESPAWN OVERLAY */}
        {reviveTimer > 0 && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-40 animate-fadeIn">
            <div className="flex flex-col items-center gap-3 bg-[#0d1527] border border-red-500/20 p-8 rounded-2xl text-center shadow-2xl animate-scaleUp">
              <RefreshCw size={28} className="text-red-500 animate-spin" />
              <h3 className="m-0 text-white text-sm font-bold tracking-widest uppercase mt-2">
                YOUR CHARACTER FELL IN BATTLE
              </h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Resurrecting at portal gateway in <span className="text-red-400 font-bold">{reviveTimer}s</span>...
              </p>
            </div>
          </div>
        )}

        {/* PERSISTENT SYSTEM CHAT BOX OVERLAY */}
        <div className="absolute bottom-6 left-6 max-w-sm bg-black/60 border border-white/5 rounded-xl p-3.5 flex flex-col gap-1.5 select-none text-[10px] font-mono pointer-events-none z-20 max-h-[140px] overflow-y-auto custom-scrollbar">
          <div className="text-slate-500 font-display font-bold uppercase tracking-wider border-b border-white/5 pb-1 mb-1">
            Wilderness Log
          </div>
          {wildernessChat.length === 0 ? (
            <div className="text-slate-600">The forest whispers in silicon...</div>
          ) : (
            wildernessChat.map(c => (
              <div key={c.id} style={{ color: c.color }} className="leading-relaxed">
                {c.text}
              </div>
            ))
          )}
        </div>

        {/* COOPERATIVE LOOT FLOATING TOAST BANNER */}
        {lootAlert && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-950/60 via-purple-900/40 to-purple-950/60 border border-purple-500/35 rounded-2xl px-6 py-3.5 text-center flex flex-col gap-0.5 items-center z-40 animate-scaleUp pointer-events-none shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <span className="text-white text-xs font-bold font-display uppercase tracking-widest">
              {lootAlert.text}
            </span>
            {lootAlert.subText && (
              <span className="text-slate-300 text-[9px] font-mono uppercase">
                {lootAlert.subText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
