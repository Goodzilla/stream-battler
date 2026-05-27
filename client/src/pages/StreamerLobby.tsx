import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { TwitchConsole } from '../components/TwitchConsole';
import { getDistance, getDirection, seek } from '../game/physics';
import { ArrowLeft, Play, Users, Skull, ShieldAlert } from 'lucide-react';
import { CLASSES } from '../game/constants';

interface StreamerLobbyProps {
  user: any;
  bossName: string;
  bossLevel: number;
  socket: Socket | null;
  onBackToDashboard: () => void;
}

interface RaidUnit {
  id: string;
  isPlayer: boolean;
  name: string;
  x: number;
  y: number;
  maxHp: number;
  hp: number;
  speed: number;
  attackPower: number;
  critChance: number;
  critMult: number;
  atkSpeed: number;
  attackRange: number;
  color: string;
  classType?: string;
  // CD
  atkTimer: number;
  skillTimer: number;
  activeSkillCd: number;
  // State
  stunTimer: number;
  isHealer?: boolean;
}

export const StreamerLobby: React.FC<StreamerLobbyProps> = ({
  user,
  bossName,
  bossLevel,
  socket,
  onBackToDashboard
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [lobby, setLobby] = useState<any | null>(null);
  const [battleState, setBattleState] = useState<'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT'>('LOBBY');
  const [rewardsList, setRewardsList] = useState<any | null>(null);

  const stateRef = useRef<{
    units: RaidUnit[];
    projectiles: any[];
    damageTexts: any[];
    bossMaxHp: number;
    battleState: 'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT';
  }>({
    units: [],
    projectiles: [],
    damageTexts: [],
    bossMaxHp: 100,
    battleState: 'LOBBY'
  });

  const streamerName = user.username;

  useEffect(() => {
    if (!socket) return;

    // 1. Create the lobby on server
    socket.emit('create-lobby', {
      streamerName,
      bossName,
      bossLevel
    });

    const handleLobbyUpdate = (updatedLobby: any) => {
      setLobby(updatedLobby);
    };

    const handleRaidEnded = (results: any) => {
      setBattleState(results.success ? 'VICTORY' : 'DEFEAT');
      setRewardsList(results.rewards);
    };

    socket.on('lobby-update', handleLobbyUpdate);
    socket.on('raid-ended', handleRaidEnded);

    return () => {
      socket.off('lobby-update', handleLobbyUpdate);
      socket.off('raid-ended', handleRaidEnded);
    };
  }, [socket, streamerName, bossName, bossLevel]);

  // Streamer starts the raid
  const handleStartRaid = () => {
    if (!socket || !lobby || lobby.viewers.length === 0) {
      alert('You need at least 1 viewer in the lobby to start the raid!');
      return;
    }

    socket.emit('start-raid', { streamerName });
    setBattleState('FIGHTING');
    initRaidEngine();
  };

  // Initialize raid entities and canvas loops
  const initRaidEngine = () => {
    const viewersList = lobby?.viewers || [];

    // 1. Build Viewer Units
    const playerUnits: RaidUnit[] = viewersList.map((v: any, index: number) => {
      // Base stats derived from class, level
      // Warriors have high HP, Rogues fast speed, etc.
      let baseHp = 130 + v.level * 15;
      let baseAtk = 15 + v.level * 2;
      let speed = 90;
      let range = 40;
      let color = '#ffffff';

      switch (v.charClass) {
        case 'WARRIOR':
          baseHp = 220 + v.level * 25;
          baseAtk = 14 + v.level * 1.5;
          speed = 95;
          color = '#ff3b30';
          break;
        case 'MAGE':
          baseHp = 100 + v.level * 10;
          baseAtk = 26 + v.level * 3.5;
          speed = 85;
          range = 180;
          color = '#007aff';
          break;
        case 'CLERIC':
          baseHp = 140 + v.level * 15;
          baseAtk = 13 + v.level * 1.2;
          speed = 90;
          color = '#ffcc00';
          break;
        case 'ROGUE':
          baseHp = 110 + v.level * 12;
          baseAtk = 20 + v.level * 2.5;
          speed = 120;
          color = '#af52de';
          break;
        case 'RANGER':
          baseHp = 120 + v.level * 14;
          baseAtk = 18 + v.level * 2.2;
          speed = 105;
          range = 220;
          color = '#34c759';
          break;
      }

      // Add simple offset row positions
      const row = index % 3;
      const col = Math.floor(index / 3);

      return {
        id: v.userId,
        isPlayer: true,
        name: v.displayName,
        x: 80 - col * 40 + Math.random() * 10,
        y: 120 + row * 80 + Math.random() * 20,
        maxHp: baseHp,
        hp: baseHp,
        speed,
        attackPower: baseAtk,
        critChance: v.charClass === 'ROGUE' ? 0.18 : 0.08,
        critMult: v.charClass === 'ROGUE' ? 2.0 : 1.5,
        atkSpeed: v.charClass === 'ROGUE' ? 1.4 : (v.charClass === 'RANGER' ? 1.1 : 0.8),
        attackRange: range,
        color,
        classType: v.charClass,
        atkTimer: Math.random() * 1.0,
        skillTimer: Math.random() * 2.0,
        activeSkillCd: v.charClass === 'WARRIOR' ? 6 : (v.charClass === 'MAGE' ? 5 : (v.charClass === 'CLERIC' ? 7 : 8)),
        stunTimer: 0,
        isHealer: v.charClass === 'CLERIC'
      };
    });

    // 2. Build Giant Boss Unit
    const bossHp = 300 + viewersList.length * 300 + bossLevel * 120;
    const bossUnit: RaidUnit = {
      id: 'boss',
      isPlayer: false,
      name: bossName,
      x: 620,
      y: 200,
      maxHp: bossHp,
      hp: bossHp,
      speed: 40,
      attackPower: 8 + bossLevel * 2,
      critChance: 0.05,
      critMult: 1.5,
      atkSpeed: 0.6,
      attackRange: 80, // larger reach
      color: '#ff9500', // Legendary Orange
      atkTimer: 2.0,
      skillTimer: 5.0, // boss laser cooldown
      activeSkillCd: 6.0,
      stunTimer: 0
    };

    stateRef.current = {
      units: [...playerUnits, bossUnit],
      projectiles: [],
      damageTexts: [],
      bossMaxHp: bossHp,
      battleState: 'FIGHTING'
    };
  };

  // Run the canvas engine loop and socket emits
  useEffect(() => {
    if (battleState !== 'FIGHTING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let emitTimer = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      const s = stateRef.current;

      const boss = s.units.find(u => !u.isPlayer);
      const players = s.units.filter(u => u.isPlayer);

      // Fight checks
      if (players.length === 0 && s.battleState === 'FIGHTING') {
        s.battleState = 'DEFEAT';
        socket?.emit('streamer-raid-end', { streamerName, success: false, bossName, bossLevel });
      } else if (!boss && s.battleState === 'FIGHTING') {
        s.battleState = 'VICTORY';
        socket?.emit('streamer-raid-end', { streamerName, success: true, bossName, bossLevel });
      }

      if (s.battleState === 'FIGHTING' && boss) {
        // 1. UPDATE PLAYERS
        players.forEach(p => {
          if (p.stunTimer > 0) {
            p.stunTimer -= dt;
            return;
          }

          // Clerics check healths first
          let target: RaidUnit | null = null;
          if (p.isHealer) {
            // Find lowest hp player
            let lowestHp = 9.9;
            players.forEach(other => {
              const pct = other.hp / other.maxHp;
              if (pct < lowestHp) {
                lowestHp = pct;
                target = other;
              }
            });
            // If everyone healthy, target boss
            if (lowestHp > 0.85) target = boss;
          } else {
            target = boss;
          }

          if (target) {
            const dist = getDistance(p, target);
            if (p.atkTimer > 0) p.atkTimer -= dt;
            if (p.skillTimer > 0) p.skillTimer -= dt;

            // Separation
            let steerX = 0;
            let steerY = 0;
            players.forEach(other => {
              if (other.id !== p.id) {
                if (getDistance(p, other) < 22) {
                  const dir = getDirection(other, p);
                  steerX += dir.x * 20 * dt;
                  steerY += dir.y * 20 * dt;
                }
              }
            });

            if (dist <= p.attackRange) {
              // Basic attack
              if (p.atkTimer <= 0) {
                p.atkTimer = 1.0 / p.atkSpeed;

                if (p.isHealer && target.isPlayer) {
                  // Healing
                  const isCrit = Math.random() < p.critChance;
                  const finalHeal = Math.round(p.attackPower * (isCrit ? p.critMult : 1.0) * 0.8);
                  target.hp = Math.min(target.maxHp, target.hp + finalHeal);

                  // visual beam
                  s.projectiles.push({ fx: p.x, fy: p.y, tx: target.x, ty: target.y, color: '#ffcc00', life: 8 });
                  s.damageTexts.push({ x: target.x, y: target.y - 12, text: `+${finalHeal}`, color: '#ffcc00', life: 40 });
                } else {
                  // Damage boss
                  const isCrit = Math.random() < p.critChance;
                  const finalDmg = Math.round(p.attackPower * (isCrit ? p.critMult : 1.0));
                  target.hp = Math.max(0, target.hp - finalDmg);

                  s.projectiles.push({ fx: p.x, fy: p.y, tx: target.x, ty: target.y, color: p.color, life: 6 });
                  s.damageTexts.push({ x: target.x + (Math.random() * 40 - 20), y: target.y - 20 - (Math.random() * 20), text: `${finalDmg}`, color: isCrit ? '#ff9500' : '#ffffff', life: 45, isCrit });
                }
              }

              // Active Skill
              if (p.skillTimer <= 0) {
                p.skillTimer = p.activeSkillCd;

                if (p.classType === 'WARRIOR') {
                  // Stun boss
                  boss.stunTimer = 1.5;
                  const dmg = p.attackPower * 2.0;
                  boss.hp = Math.max(0, boss.hp - dmg);
                  s.damageTexts.push({ x: boss.x, y: boss.y - 40, text: `${dmg} (Stun Shield!)`, color: '#ff3b30', life: 50, isCrit: true });
                } else if (p.classType === 'MAGE') {
                  // Meteor
                  const dmg = Math.round(p.attackPower * 3.0);
                  boss.hp = Math.max(0, boss.hp - dmg);
                  s.damageTexts.push({ x: boss.x + (Math.random() * 30 - 15), y: boss.y - 30, text: `${dmg} (Fireball AoE)`, color: '#00d8ff', life: 50, isCrit: true });
                } else if (p.classType === 'CLERIC') {
                  // Heal group, hit boss
                  players.forEach(pl => {
                    const heal = Math.round(p.attackPower * 1.5);
                    pl.hp = Math.min(pl.maxHp, pl.hp + heal);
                    s.damageTexts.push({ x: pl.x, y: pl.y - 12, text: `+${heal}`, color: '#ffcc00', life: 40 });
                  });
                  const dmg = Math.round(p.attackPower * 1.0);
                  boss.hp = Math.max(0, boss.hp - dmg);
                  s.damageTexts.push({ x: boss.x, y: boss.y - 30, text: `${dmg} (Nova)`, color: '#ffcc00', life: 40 });
                } else if (p.classType === 'ROGUE') {
                  // Blade dance
                  const dmg = Math.round(p.attackPower * 0.75);
                  for (let strike = 0; strike < 5; strike++) {
                    setTimeout(() => {
                      if (boss && boss.hp > 0) {
                        boss.hp = Math.max(0, boss.hp - dmg);
                        s.damageTexts.push({ x: boss.x + (Math.random() * 40 - 20), y: boss.y - 20, text: `${dmg}`, color: '#af52de', life: 35 });
                      }
                    }, strike * 100);
                  }
                } else if (p.classType === 'RANGER') {
                  // Arrow Rain
                  const dmg = Math.round(p.attackPower * 2.0);
                  boss.hp = Math.max(0, boss.hp - dmg);
                  s.damageTexts.push({ x: boss.x, y: boss.y - 30, text: `${dmg} (Arrow Rain)`, color: '#34c759', life: 45 });
                }
              }
            } else {
              // Seek target
              const nextPos = seek(p, target, p.speed, dt);
              p.x = nextPos.x + steerX;
              p.y = nextPos.y + steerY;
            }
          }
        });

        // 2. UPDATE BOSS
        if (boss.stunTimer > 0) {
          boss.stunTimer -= dt;
        } else {
          // Boss seeks nearest player
          let target: RaidUnit | null = null;
          let minDist = 9999;
          players.forEach(p => {
            const dist = getDistance(boss, p);
            if (dist < minDist) {
              minDist = dist;
              target = p;
            }
          });

          if (target) {
            if (boss.atkTimer > 0) boss.atkTimer -= dt;
            if (boss.skillTimer > 0) boss.skillTimer -= dt;

            const dist = getDistance(boss, target);

            if (dist <= boss.attackRange) {
              // Swipe swipe
              if (boss.atkTimer <= 0) {
                boss.atkTimer = 1.0 / boss.atkSpeed;

                // Swipe hit target and anyone nearby
                players.forEach(p => {
                  if (getDistance(boss, p) <= boss.attackRange + 20) {
                    const dmg = boss.attackPower;
                    p.hp = Math.max(0, p.hp - dmg);
                    s.damageTexts.push({ x: p.x, y: p.y - 12, text: `${dmg}`, color: '#ff3b30', life: 40 });
                  }
                });
              }

              // Active laser attack
              if (boss.skillTimer <= 0) {
                boss.skillTimer = boss.activeSkillCd;

                // Fire broad laser arc
                ctx.strokeStyle = '#ff9500';
                ctx.lineWidth = 15;
                ctx.beginPath(); ctx.moveTo(boss.x, boss.y); ctx.lineTo(50, boss.y + (Math.random() * 200 - 100)); ctx.stroke();

                players.forEach(p => {
                  const dmg = Math.round(boss.attackPower * 2.2);
                  p.hp = Math.max(0, p.hp - dmg);
                  s.damageTexts.push({ x: p.x, y: p.y - 16, text: `${dmg} (Laser Arc!)`, color: '#ff9500', life: 55, isCrit: true });
                });
              }
            } else {
              // Seek target
              const nextPos = seek(boss, target, boss.speed, dt);
              boss.x = nextPos.x;
              boss.y = nextPos.y;
            }
          }
        }

        // Dead cleanups
        s.units = s.units.filter(u => u.hp > 0);
      }

      // 3. DRAW COMBAT SCENE
      s.units.forEach(unit => {
        const isB = !unit.isPlayer;
        const r = isB ? 30 : 12;

        ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
        ctx.strokeStyle = unit.color;
        ctx.lineWidth = isB ? 4 : 2;
        ctx.shadowColor = unit.color;
        ctx.shadowBlur = isB ? 20 : 10;

        ctx.beginPath();
        if (isB) {
          // Giant boss octagon
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const px = unit.x + r * Math.cos(angle);
            const py = unit.y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        } else {
          ctx.arc(unit.x, unit.y, r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset

        // Name
        ctx.fillStyle = '#94a3b8';
        ctx.font = isB ? 'bold 10px Orbitron, sans-serif' : '8px font-display, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name, unit.x, unit.y - r - 12);

        // HP bar
        const barW = isB ? 80 : 24;
        const barH = isB ? 5 : 3;
        const bx = unit.x - barW / 2;
        const by = unit.y - r - 6;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx, by, barW, barH);

        const hpPct = Math.max(0, unit.hp / unit.maxHp);
        ctx.fillStyle = !isB ? '#34c759' : '#ff9500';
        ctx.fillRect(bx, by, barW * hpPct, barH);
      });

      // 4. DRAW PROJECTILE LINES
      s.projectiles = s.projectiles.filter(p => {
        p.life -= 1;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.fx, p.fy);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
        return p.life > 0;
      });

      // 5. DRAW DAMAGE TEXTS
      s.damageTexts = s.damageTexts.filter(ft => {
        ft.y -= 0.5;
        ft.life -= 1;
        ctx.fillStyle = ft.color;
        ctx.font = ft.isCrit ? '900 11px Orbitron, sans-serif' : '700 9px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        return ft.life > 0;
      });

      // 6. EMIT COORDINATES TO VIEWERS (SOCKET SYNC - capped at 20 FPS)
      emitTimer += dt;
      if (emitTimer >= 0.05 && s.battleState === 'FIGHTING') {
        emitTimer = 0;

        const snapshot = {
          units: s.units.map(u => ({
            id: u.id,
            name: u.name,
            x: Math.round(u.x),
            y: Math.round(u.y),
            hp: u.hp,
            maxHp: u.maxHp,
            color: u.color,
            isPlayer: u.isPlayer,
            classType: u.classType
          })),
          projectiles: s.projectiles.map(p => ({ fx: p.fx, fy: p.fy, tx: p.tx, ty: p.ty, color: p.color })),
          damageTexts: s.damageTexts.map(dt => ({ x: dt.x, y: dt.y, text: dt.text, color: dt.color, isCrit: dt.isCrit }))
        };

        socket?.emit('streamer-state-update', { streamerName, snapshot });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [battleState]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-display font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Return to Dashboard
        </button>

        <span className="text-xs text-purple-400 font-display font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
          Streamer Lobby Panel
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Lobby Details / Battlefield */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {battleState === 'LOBBY' ? (
            <div className="glass-panel p-6 border-white/5 bg-[#0b0f19]">
              <h3 className="m-0 text-white font-display text-base tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Users size={18} className="text-purple-400" />
                Raid Lobby: #{streamerName.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Waiting for viewers. Tell your chat to type <span className="text-[#af52de] font-bold">!join</span> to enter the battle field! Or add mock viewers on the right console.
              </p>

              <div className="flex flex-col gap-2 border-y border-white/5 py-4 my-6 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Target Boss:</span>
                  <span className="text-white font-bold">{bossName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Boss Level:</span>
                  <span className="text-white font-bold">{bossLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Joined Viewers:</span>
                  <span className="text-[#00d8ff] font-bold">{lobby?.viewers.length || 0}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={!lobby || lobby.viewers.length === 0}
                  onClick={handleStartRaid}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-display uppercase font-bold tracking-widest text-xs flex items-center justify-center gap-2 transition duration-300 shadow-lg hover:shadow-purple-500/20"
                >
                  <Play size={14} />
                  Start Raid Fight
                </button>
              </div>
            </div>
          ) : battleState === 'FIGHTING' ? (
            <div className="border border-white/5 rounded-xl overflow-hidden shadow-2xl bg-[#06080d]">
              <canvas ref={canvasRef} width="760" height="400" className="w-full block aspect-[760/400]" />
            </div>
          ) : (
            // Results screen (VICTORY / DEFEAT)
            <div className="glass-panel p-6 border-white/5 text-center flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  battleState === 'VICTORY'
                    ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'
                    : 'bg-red-950/20 text-red-400 border border-red-900/30'
                }`}
              >
                {battleState === 'VICTORY' ? <Skull size={24} /> : <ShieldAlert size={24} />}
              </div>
              <h3
                className={`m-0 font-display text-2xl tracking-widest ${
                  battleState === 'VICTORY' ? 'text-emerald-400' : 'text-red-500'
                }`}
              >
                {battleState === 'VICTORY' ? 'RAID VICTORY!' : 'RAID DEFEATED'}
              </h3>
              <p className="text-slate-500 text-[10px] uppercase font-display tracking-widest mt-1 mb-6">
                Raid ended successfully. Lobby rewards have been distributed.
              </p>

              {rewardsList && Object.keys(rewardsList).length > 0 && (
                <div className="w-full max-w-md bg-[#0b0f19] border border-white/5 rounded-xl p-4 text-xs text-slate-400 text-left flex flex-col gap-3">
                  <span className="block text-[9px] font-display text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                    Loot Rewards Distribution list:
                  </span>
                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {Object.entries(rewardsList).map(([userId, rew]: [string, any]) => {
                      const viewer = lobby?.viewers.find((v: any) => v.userId === userId);
                      return (
                        <div key={userId} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                          <span className="font-bold text-white">{viewer?.displayName || 'Viewer'}</span>
                          <div className="flex gap-3 text-[10px] font-mono">
                            <span className="text-emerald-400">+{rew.xp}xp</span>
                            <span className="text-yellow-400">+{rew.gold}g</span>
                            {rew.itemDropped && (
                              <span className="text-orange-400 font-bold border border-orange-500/20 px-1 rounded bg-orange-950/10">
                                {rew.itemDropped.rarity} {rew.itemDropped.name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setBattleState('LOBBY');
                  setRewardsList(null);
                }}
                className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition"
              >
                Reset Lobby Room
              </button>
            </div>
          )}

          {/* Joined Viewers List */}
          {battleState === 'LOBBY' && (
            <div className="glass-panel p-6 border-white/5">
              <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-4">
                LOBBY PARTICIPANTS ({lobby?.viewers.length || 0})
              </h3>

              {(!lobby || lobby.viewers.length === 0) ? (
                <div className="text-slate-500 italic text-xs py-4 text-center">
                  Lobby is empty. Use the Twitch chat simulator on the right to mock players.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lobby.viewers.map((viewer: any) => (
                    <div
                      key={viewer.userId}
                      className="p-3 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-xs truncate max-w-[100px]">{viewer.displayName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Lvl {viewer.level} {viewer.charClass}
                        </div>
                      </div>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CLASSES[viewer.charClass]?.color || '#ffffff' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Hand twitch console */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <TwitchConsole streamerName={streamerName} socket={socket} />
        </div>
      </div>
    </div>
  );
};
