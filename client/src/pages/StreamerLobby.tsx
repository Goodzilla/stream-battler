import React, { useEffect, useRef, useState } from 'react';
import { TwitchConsole } from '../components/TwitchConsole';
import { getDistance } from '../game/physics';
import { ArrowLeft, Play, Users, Skull, ShieldAlert } from 'lucide-react';
import { CLASSES, getArenaConfigForLevel } from 'shared';
import confetti from 'canvas-confetti';
import { soundManager } from '../game/soundManager';
import { drawPixelSprite, drawProceduralBackground } from '../game/sprites';
import {
  updateUnitPhysics,
  performBasicAttack,
  castActiveSkill,
  updateVisuals,
  createExplosion,
  getUnitDamageTheme
} from '../game/combatEngine';
import type {
  CombatUnit as RaidUnit,
  FloatingText as DamageText,
  Particle as VisualParticle,
  Projectile
} from '../game/combatEngine';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useUI } from '../contexts/UIContext';

interface StreamerLobbyProps {
  bossName: string;
  bossLevel: number;
  onBackToDashboard: () => void;
}

const getBossSprite = (level: number) => {
  return getArenaConfigForLevel(level).enemySprite;
};

export const StreamerLobby: React.FC<StreamerLobbyProps> = ({
  bossName,
  bossLevel,
  onBackToDashboard
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showAlert } = useUI();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [lobby, setLobby] = useState<any | null>(null);
  const [battleState, setBattleState] = useState<'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT'>('LOBBY');
  const [rewardsList, setRewardsList] = useState<any | null>(null);
  const [recapStats, setRecapStats] = useState<any[] | null>(null);
  const [recapTick, setRecapTick] = useState(0);
  void recapTick;
  const [masterVolume, setMasterVolume] = useState(0.5);
  const [musicVolume, setMusicVolume] = useState(0.2);

  useEffect(() => {
    soundManager.setVolume(masterVolume, musicVolume);
  }, [masterVolume, musicVolume]);


  const stateRef = useRef<{
    units: RaidUnit[];
    projectiles: Projectile[];
    damageTexts: DamageText[];
    particles: VisualParticle[];
    bossMaxHp: number;
    battleState: 'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT';
    shakeTimer: number;
    shakeIntensity: number;
  }>({
    units: [],
    projectiles: [],
    damageTexts: [],
    particles: [],
    bossMaxHp: 100,
    battleState: 'LOBBY',
    shakeTimer: 0,
    shakeIntensity: 0
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
      setRecapStats(results.recapStats || null);
      if (results.success) {
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
        soundManager.playVictory();
      } else {
        soundManager.playDefeat();
      }
    };

    const handleLobbyError = (err: any) => {
      showAlert(err.error || 'A lobby error occurred', 'LOBBY ERROR');
    };

    socket.on('lobby-update', handleLobbyUpdate);
    socket.on('raid-ended', handleRaidEnded);
    socket.on('lobby-error', handleLobbyError);

    return () => {
      socket.off('lobby-update', handleLobbyUpdate);
      socket.off('raid-ended', handleRaidEnded);
      socket.off('lobby-error', handleLobbyError);
      soundManager.stopMusic();
    };
  }, [socket, streamerName, bossName, bossLevel]);

  // Streamer starts the raid
  const handleStartRaid = () => {
    if (!socket || !lobby || lobby.viewers.length === 0) {
      showAlert('You need at least 1 viewer in the lobby to start the raid!', 'START RAID ERROR');
      return;
    }

    socket.emit('start-raid', { streamerName });
    setBattleState('FIGHTING');
    soundManager.startMusic();
    initRaidEngine();
  };

  const handleCloseRaid = () => {
    socket?.emit('close-lobby', { streamerName });
    onBackToDashboard();
  };

  const handleRestartRaid = () => {
    setRewardsList(null);
    setRecapStats(null);
    handleStartRaid();
  };

  // Initialize raid entities and canvas loops
  const initRaidEngine = () => {
    const viewersList = lobby?.viewers || [];

    // 1. Build Viewer Units
    const playerUnits: RaidUnit[] = viewersList.map((v: any) => {
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
        case 'VALKYRIE':
          baseHp = 250 + v.level * 28;
          baseAtk = 18 + v.level * 2.0;
          speed = 100;
          range = 50;
          color = '#ff0055';
          break;
        case 'NECROMANCER':
          baseHp = 120 + v.level * 12;
          baseAtk = 28 + v.level * 3.8;
          speed = 90;
          range = 190;
          color = '#39ff14';
          break;
        case 'MONK':
          baseHp = 160 + v.level * 18;
          baseAtk = 18 + v.level * 2.2;
          speed = 115;
          range = 40;
          color = '#ff6b00';
          break;
        case 'ALCHEMIST':
          baseHp = 130 + v.level * 15;
          baseAtk = 22 + v.level * 2.8;
          speed = 110;
          range = 150;
          color = '#adff2f';
          break;
        case 'BARD':
          baseHp = 140 + v.level * 16;
          baseAtk = 16 + v.level * 1.8;
          speed = 110;
          range = 210;
          color = '#ff007f';
          break;
      }

      const unitMaxHp = v.maxHp || baseHp;
      const unitAttackPower = v.attackPower || baseAtk;
      const unitCritChance = v.critChance !== undefined ? v.critChance : (['ROGUE', 'MONK', 'ALCHEMIST'].includes(v.charClass) ? 0.18 : 0.08);
      const unitCritMult = v.critMult !== undefined ? v.critMult : (['ROGUE', 'MONK', 'ALCHEMIST'].includes(v.charClass) ? 2.0 : 1.5);
      const unitAtkSpeed = v.atkSpeed !== undefined ? v.atkSpeed : (v.charClass === 'ROGUE' ? 1.4 : (v.charClass === 'MONK' ? 1.25 : (v.charClass === 'RANGER' ? 1.1 : 0.8)));
      const unitCdr = v.cdr !== undefined ? v.cdr : 0;

      const talentsList = v.selectedTalents || [];
      let baseCd = CLASSES[v.charClass]?.activeSkill.cooldown || 8;
      if (v.charClass === 'WARRIOR') {
        if (talentsList.includes('t1_1')) baseCd -= 1.5;
        if (talentsList.includes('t5_2')) baseCd += 2.0;
        if (talentsList.includes('t6_2')) baseCd -= 2.0;
        if (talentsList.includes('t10_1')) baseCd -= 3.0;
      } else if (v.charClass === 'MAGE') {
        if (talentsList.includes('t1_1')) baseCd -= 1.0;
        if (talentsList.includes('t6_1')) baseCd -= 1.5;
        if (talentsList.includes('t10_2')) baseCd -= 2.5;
      } else if (v.charClass === 'CLERIC') {
        if (talentsList.includes('t1_1')) baseCd -= 1.5;
        if (talentsList.includes('t5_1')) baseCd -= 2.0;
        if (talentsList.includes('t10_1')) baseCd -= 1.0;
        if (talentsList.includes('t10_2')) baseCd -= 3.0;
      } else if (v.charClass === 'ROGUE') {
        if (talentsList.includes('t2_2')) baseCd -= 1.5;
        if (talentsList.includes('t6_1')) baseCd -= 2.0;
        if (talentsList.includes('t10_2')) baseCd -= 3.0;
      } else if (v.charClass === 'RANGER') {
        if (talentsList.includes('t1_2')) baseCd -= 1.5;
        if (talentsList.includes('t5_1')) baseCd -= 2.0;
        if (talentsList.includes('t9_1')) baseCd -= 3.0;
        if (talentsList.includes('t10_2')) baseCd -= 4.0;
      } else if (v.charClass === 'VALKYRIE') {
        if (talentsList.includes('t1_1')) baseCd -= 1.0;
        if (talentsList.includes('t4_2')) baseCd -= 1.5;
        if (talentsList.includes('t9_1')) baseCd -= 2.0;
        if (talentsList.includes('t10_2')) baseCd -= 3.0;
      } else if (v.charClass === 'NECROMANCER') {
        if (talentsList.includes('t1_1')) baseCd -= 1.0;
        if (talentsList.includes('t4_1')) baseCd -= 1.5;
        if (talentsList.includes('t6_1')) baseCd -= 2.0;
        if (talentsList.includes('t10_2')) baseCd -= 3.0;
      } else if (v.charClass === 'MONK') {
        if (talentsList.includes('t1_1')) baseCd -= 1.0;
        if (talentsList.includes('t4_2')) baseCd -= 1.5;
        if (talentsList.includes('t6_1')) baseCd -= 2.0;
        if (talentsList.includes('t10_2')) baseCd -= 3.5;
      } else if (v.charClass === 'ALCHEMIST') {
        if (talentsList.includes('t1_1')) baseCd -= 1.0;
        if (talentsList.includes('t6_1')) baseCd -= 1.5;
        if (talentsList.includes('t10_1')) baseCd -= 2.0;
        if (talentsList.includes('t10_2')) baseCd -= 3.5;
      } else if (v.charClass === 'BARD') {
        if (talentsList.includes('t1_1')) baseCd -= 1.0;
        if (talentsList.includes('t4_2')) baseCd -= 1.5;
        if (talentsList.includes('t6_1')) baseCd -= 2.0;
        if (talentsList.includes('t10_2')) baseCd -= 3.5;
      }

      // Random scatter layout on the left side of the screen (x between 50 and 400, y between 50 and 550)
      return {
        id: v.userId,
        isPlayer: true,
        name: v.displayName,
        x: 50 + Math.random() * 350,
        y: 50 + Math.random() * 500,
        maxHp: unitMaxHp,
        hp: unitMaxHp,
        speed: v.speed || speed,
        attackPower: unitAttackPower,
        critChance: unitCritChance,
        critMult: unitCritMult,
        atkSpeed: unitAtkSpeed,
        attackRange: range,
        color,
        classType: v.charClass,
        atkTimer: Math.random() * 1.0,
        skillTimer: Math.random() * 2.0,
        activeSkillCd: Math.max(1, baseCd * (1 - unitCdr)),
        stunTimer: 0,
        isHealer: v.charClass === 'CLERIC',
        defense: v.defense || 0,
        lifesteal: v.lifesteal || 0,
        reflect: v.reflect || 0,
        fireRes: v.fireRes || 0,
        coldRes: v.coldRes || 0,
        poisonRes: v.poisonRes || 0,
        physRes: v.physRes || 0,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        selectedTalents: talentsList
      };
    });

    // 2. Build Giant Boss Unit
    const normalBossHp = Math.round(300 + 500 + bossLevel * 150 + Math.pow(bossLevel, 2) * 12);
    const bossHp = normalBossHp * viewersList.length;
    const bossAtk = Math.round(8 + bossLevel * 2 + Math.pow(bossLevel, 1.8) * 0.06);
    const bossUnit: RaidUnit = {
      id: 'boss',
      isPlayer: false,
      name: bossName,
      x: 1000,
      y: 300,
      maxHp: bossHp,
      hp: bossHp,
      speed: 40,
      attackPower: bossAtk,
      critChance: 0.05,
      critMult: 1.5,
      atkSpeed: 0.6,
      attackRange: 80, // larger reach
      color: '#ff9500', // Legendary Orange
      atkTimer: 2.0,
      skillTimer: 5.0, // boss laser cooldown
      activeSkillCd: 6.0,
      stunTimer: 0,
      classType: getBossSprite(bossLevel),
      damageDealt: 0,
      healingDone: 0,
      damageTaken: 0
    };

    stateRef.current = {
      units: [...playerUnits, bossUnit],
      projectiles: [],
      damageTexts: [],
      particles: [],
      bossMaxHp: bossHp,
      battleState: 'FIGHTING',
      shakeTimer: 0,
      shakeIntensity: 0
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
    let frameCount = 0;

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      frameCount++;
      if (frameCount % 15 === 0) {
        setRecapTick(f => f + 1);
      }

      const s = stateRef.current;

      // Screen shake duration tick
      if (s.shakeTimer > 0) {
        s.shakeTimer -= dt;
      }

      ctx.save();
      if (s.shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * s.shakeIntensity;
        const dy = (Math.random() - 0.5) * s.shakeIntensity;
        ctx.translate(dx, dy);
      }

      // Draw themed background based on boss level
      drawProceduralBackground(ctx, canvas.width, canvas.height, getArenaConfigForLevel(bossLevel));

      const boss = s.units.find(u => !u.isPlayer);
      const livingPlayers = s.units.filter(u => u.isPlayer && u.hp > 0);
      const allPlayers = s.units.filter(u => u.isPlayer);

      // Fight checks
      if (livingPlayers.length === 0 && s.battleState === 'FIGHTING') {
        s.battleState = 'DEFEAT';
        const recapStats = allPlayers.map(p => {
          const damageDealt = p.damageDealt || 0;
          const healingDone = p.healingDone || 0;
          const damageTaken = p.damageTaken || 0;
          const score = damageDealt + healingDone * 1.5 + damageTaken * 0.8;
          return {
            userId: p.id,
            name: p.name,
            classType: p.classType || 'WARRIOR',
            damageDealt,
            healingDone,
            damageTaken,
            color: p.color,
            score
          };
        }).sort((a, b) => b.score - a.score);

        socket?.emit('streamer-raid-end', {
          streamerName,
          success: false,
          bossName,
          bossLevel,
          recapStats
        });
      } else if (boss && boss.hp <= 0 && s.battleState === 'FIGHTING') {
        s.battleState = 'VICTORY';
        const recapStats = allPlayers.map(p => {
          const damageDealt = p.damageDealt || 0;
          const healingDone = p.healingDone || 0;
          const damageTaken = p.damageTaken || 0;
          const score = damageDealt + healingDone * 1.5 + damageTaken * 0.8;
          return {
            userId: p.id,
            name: p.name,
            classType: p.classType || 'WARRIOR',
            damageDealt,
            healingDone,
            damageTaken,
            color: p.color,
            score
          };
        }).sort((a, b) => b.score - a.score);

        socket?.emit('streamer-raid-end', {
          streamerName,
          success: true,
          bossName,
          bossLevel,
          recapStats
        });
      }

      if (s.battleState === 'FIGHTING' && boss && boss.hp > 0) {
        // Update unit hit flash timers
        s.units.forEach(unit => {
          if (unit.flashTimer && unit.flashTimer > 0) {
            unit.flashTimer -= dt;
          }
        });

        // 1. UPDATE PLAYERS
        allPlayers.forEach(p => {
          if (p.hp <= 0) return;

          if (p.stunTimer > 0) {
            p.stunTimer -= dt;
            return;
          }

          let target: RaidUnit | null = null;
          if (p.isHealer) {
            let lowestHp = 9.9;
            allPlayers.forEach(other => {
              if (other.hp <= 0) return;
              const pct = other.hp / other.maxHp;
              if (pct < lowestHp) {
                lowestHp = pct;
                target = other;
              }
            });
            if (lowestHp > 0.85) target = boss;
          } else {
            target = boss;
          }

          if (target) {
            const dist = getDistance(p, target);
            if (p.atkTimer > 0) p.atkTimer -= dt;
            if (p.skillTimer > 0) p.skillTimer -= dt;

            const alliesList = s.units.filter(other => other.isPlayer === p.isPlayer);
            const enemiesList = s.units.filter(other => other.isPlayer !== p.isPlayer);

            if (dist <= p.attackRange) {
              if (p.atkTimer <= 0) {
                const dummyRecap = {
                  shakeTimer: s.shakeTimer,
                  shakeIntensity: s.shakeIntensity,
                  playerDamageDealt: p.damageDealt || 0,
                  playerDamageTaken: p.damageTaken || 0,
                  playerHealingDone: p.healingDone || 0
                };
                
                performBasicAttack(
                  p as any,
                  target as any,
                  dt,
                  dummyRecap,
                  s.projectiles,
                  s.damageTexts,
                  s.particles,
                  0.1
                );

                s.shakeTimer = dummyRecap.shakeTimer;
                s.shakeIntensity = dummyRecap.shakeIntensity;
                p.damageDealt = dummyRecap.playerDamageDealt;
                p.damageTaken = dummyRecap.playerDamageTaken;
                p.healingDone = dummyRecap.playerHealingDone;
              }

              if (p.skillTimer <= 0) {
                const dummyRecap = {
                  shakeTimer: s.shakeTimer,
                  shakeIntensity: s.shakeIntensity,
                  playerDamageDealt: p.damageDealt || 0,
                  playerHealingDone: p.healingDone || 0
                };

                castActiveSkill(
                  p as any,
                  target as any,
                  alliesList as any[],
                  enemiesList as any[],
                  dummyRecap,
                  s.projectiles,
                  s.damageTexts,
                  s.particles,
                  0.1
                );

                s.shakeTimer = dummyRecap.shakeTimer;
                s.shakeIntensity = dummyRecap.shakeIntensity;
                p.damageDealt = dummyRecap.playerDamageDealt;
                p.healingDone = dummyRecap.playerHealingDone;
              }
            } else {
              updateUnitPhysics(p as any, target, alliesList as any[], dt, canvas.width, canvas.height);
            }
          }
        });

        // 2. UPDATE BOSS
        if (boss.stunTimer > 0) {
          boss.stunTimer -= dt;
        } else {
          let target: RaidUnit | null = null;
          let minDist = 9999;
          allPlayers.forEach(p => {
            if (p.hp <= 0) return;
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
              if (boss.atkTimer <= 0) {
                boss.atkTimer = 1.0 / boss.atkSpeed;

                allPlayers.forEach(p => {
                  if (p.hp <= 0) return;
                  if (getDistance(boss, p) <= boss.attackRange + 20) {
                    const dummyRecap = {
                      shakeTimer: s.shakeTimer,
                      shakeIntensity: s.shakeIntensity,
                      playerDamageDealt: p.damageDealt || 0,
                      playerDamageTaken: p.damageTaken || 0,
                      playerHealingDone: p.healingDone || 0
                    };

                    performBasicAttack(
                      boss as any,
                      p as any,
                      dt,
                      dummyRecap,
                      s.projectiles,
                      s.damageTexts,
                      s.particles,
                      0.1
                    );

                    s.shakeTimer = dummyRecap.shakeTimer;
                    s.shakeIntensity = dummyRecap.shakeIntensity;
                    p.damageDealt = dummyRecap.playerDamageDealt;
                    p.damageTaken = dummyRecap.playerDamageTaken;
                    p.healingDone = dummyRecap.playerHealingDone;
                  }
                });
              }

              if (boss.skillTimer <= 0) {
                boss.skillTimer = boss.activeSkillCd;

                ctx.strokeStyle = '#ff9500';
                ctx.lineWidth = 15;
                ctx.beginPath(); ctx.moveTo(boss.x, boss.y); ctx.lineTo(50, boss.y + (Math.random() * 200 - 100)); ctx.stroke();

                s.shakeTimer = 0.4;
                s.shakeIntensity = 12;

                allPlayers.forEach(p => {
                  if (p.hp <= 0) return;
                  const baseDmg = Math.max(1, Math.round(boss.attackPower * 2.2 - (p.defense || 0) * 0.1));
                  const theme = boss.spriteType || boss.classType || 'GOBLIN_SCOUT';
                  const dmgTheme = getUnitDamageTheme(theme);
                  let physPortion = 1.0;
                  let firePortion = 0.0;
                  let coldPortion = 0.0;
                  let poisonPortion = 0.0;

                  if (dmgTheme === 'SNAKE') {
                    physPortion = 0.5;
                    poisonPortion = 0.5;
                  } else if (dmgTheme === 'LICH') {
                    physPortion = 0.0;
                    coldPortion = 1.0;
                  } else if (dmgTheme === 'DRAGON') {
                    physPortion = 0.3;
                    firePortion = 0.7;
                  }

                  const physRes = p.physRes || 0;
                  const fireRes = p.fireRes || 0;
                  const coldRes = p.coldRes || 0;
                  const poisonRes = p.poisonRes || 0;

                  const reducedPhys = baseDmg * physPortion * (1 - physRes);
                  const reducedFire = baseDmg * firePortion * (1 - fireRes);
                  const reducedCold = baseDmg * coldPortion * (1 - coldRes);
                  const reducedPoison = baseDmg * poisonPortion * (1 - poisonRes);

                  const dmg = Math.max(1, Math.round(reducedPhys + reducedFire + reducedCold + reducedPoison));
                  p.hp = Math.max(0, p.hp - dmg);
                  p.damageTaken = (p.damageTaken || 0) + dmg;
                  p.flashTimer = 0.15;
                  p.flashColor = '#ff9500';
                  s.damageTexts.push({ x: p.x, y: p.y - 16, text: `${dmg} (Laser Arc!)`, color: '#ff9500', life: 55, isCrit: true });
                  createExplosion(s.particles, p.x, p.y, '#ff9500', 15);

                  if (p.reflect && p.reflect > 0) {
                    const refl = Math.round((boss.attackPower * 2.2) * p.reflect);
                    boss.hp = Math.max(0, boss.hp - refl);
                    p.damageDealt = (p.damageDealt || 0) + refl;
                    boss.flashTimer = 0.1;
                    boss.flashColor = '#ff3b30';
                    s.damageTexts.push({ x: boss.x + (Math.random() * 40 - 20), y: boss.y - 20, text: `${refl} (Reflect)`, color: '#af52de', life: 40 });
                  }
                });
              }
            } else {
              updateUnitPhysics(boss as any, target, [], dt, canvas.width, canvas.height);
            }
          }
        }
      }

      // 3. DRAW COMBAT SCENE
      s.units.forEach(unit => {
        if (unit.hp <= 0) return;

        const isB = !unit.isPlayer;
        const r = isB ? 44 : 16;
        const uFlash = (unit.flashTimer && unit.flashTimer > 0) ? unit.flashColor : undefined;

        // Render retro 2D pixel-art sprite
        if (unit.isPlayer) {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'WARRIOR', 2.4, false, unit.color, uFlash);
        } else {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'GOBLIN', 5.5, true, unit.color, uFlash);
        }

        // Stunned indicator
        if (unit.stunTimer > 0) {
          ctx.strokeStyle = '#007aff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(unit.x, unit.y - r - 22, 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;

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

      // 4. UPDATE PARTICLES, PROJECTILES, AND FLOATING TEXTS WITH ENGINE
      updateVisuals(s.projectiles, s.damageTexts, s.particles, dt);

      // Render Particles
      s.particles = s.particles.filter(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return p.life > 0 && p.alpha > 0;
      });
      ctx.globalAlpha = 1.0;

      // Render Projectile lines
      s.projectiles = s.projectiles.filter(p => {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.fx, p.fy);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
        return p.life > 0;
      });

      // Render Damage Texts
      s.damageTexts = s.damageTexts.filter(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = ft.isCrit ? '900 11px Orbitron, sans-serif' : '700 9px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        return ft.life > 0;
      });

      // 7. EMIT COORDINATES TO VIEWERS
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
            classType: u.classType,
            damageDealt: u.damageDealt,
            healingDone: u.healingDone,
            damageTaken: u.damageTaken
          })),
          projectiles: s.projectiles.map(p => ({ fx: p.fx, fy: p.fy, tx: p.tx, ty: p.ty, color: p.color })),
          damageTexts: s.damageTexts.map(dt => ({ x: dt.x, y: dt.y, text: dt.text, color: dt.color, isCrit: dt.isCrit }))
        };

        socket?.emit('streamer-state-update', { streamerName, snapshot });
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [battleState]);

  if (battleState === 'FIGHTING') {
    const bossUnit = stateRef.current.units.find(u => !u.isPlayer);
    const bossHp = bossUnit?.hp || 0;
    const livingPlayers = stateRef.current.units.filter(u => u.isPlayer && u.hp > 0).length;
    const totalPlayers = stateRef.current.units.filter(u => u.isPlayer).length;

    return (
      <div className="fixed inset-0 bg-[#06080d] z-40 flex flex-col overflow-hidden select-none animate-fadeIn">
        {/* Widescreen Header */}
        <div className="h-14 border-b border-white/5 bg-[#090e1a] px-6 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-display flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            STREAMER RAID FIGHT: {bossName.toUpperCase()} (LEVEL {bossLevel})
          </span>

          <button
            onClick={() => {
              socket?.emit('streamer-raid-end', {
                streamerName,
                success: false,
                bossName,
                bossLevel,
                recapStats: []
              });
              setBattleState('LOBBY');
            }}
            className="flex items-center gap-2 text-[10px] font-display font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg bg-black/25"
          >
            <ArrowLeft size={12} />
            Abandon Raid
          </button>
        </div>

        {/* Split Main Body */}
        <div className="flex-grow flex flex-row overflow-hidden">
          {/* Left Canvas Port */}
          <div className="flex-grow relative flex items-center justify-center p-4 bg-[#030407]">
            <canvas
              ref={canvasRef}
              width="1200"
              height="600"
              className="w-full h-full max-w-full max-h-full object-contain block"
            />
          </div>

          {/* Right Live Recap Sidebar */}
          <div className="w-80 border-l border-white/5 bg-[#090e1a]/95 flex flex-col p-4 gap-4 overflow-y-auto">
            <h4 className="m-0 text-white font-display text-xs tracking-wider uppercase border-b border-white/5 pb-2">
              Raid Live Stats
            </h4>

            {/* Live Metrics List */}
            <div className="flex-grow overflow-y-auto flex flex-col gap-2 pr-1">
              {stateRef.current.units
                .filter(u => u.isPlayer)
                .map(p => {
                  const dmg = p.damageDealt || 0;
                  const heal = p.healingDone || 0;
                  const taken = p.damageTaken || 0;
                  return (
                    <div
                      key={p.id}
                      className="bg-[#0b0f19]/80 border border-white/5 rounded-lg p-2.5 flex flex-col gap-1 text-[10px] font-mono animate-fadeIn"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white flex items-center gap-1.5 truncate max-w-[120px]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                        {p.hp <= 0 && (
                          <span className="text-[9px] bg-red-950/40 text-red-500 border border-red-950 px-1 rounded uppercase font-bold">
                            DEAD
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-slate-400 mt-1">
                        <span>Dmg: <strong className="text-orange-400">{dmg}</strong></span>
                        <span>Heal: <strong className="text-emerald-400">{heal}</strong></span>
                        <span>Tanked: <strong className="text-blue-400">{taken}</strong></span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-400 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span>Total Viewers:</span>
                <span className="text-white font-bold">{totalPlayers}</span>
              </div>
              <div className="flex justify-between">
                <span>Living Party:</span>
                <span className="text-emerald-400 font-bold">
                  {livingPlayers} / {totalPlayers}
                </span>
              </div>
              
              {/* Boss health bar */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Boss Health:</span>
                  <span className="text-orange-400">
                    {bossHp} / {stateRef.current.bossMaxHp}
                  </span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="bg-orange-500 h-full transition-all duration-100"
                    style={{
                      width: `${Math.max(0, (bossHp / stateRef.current.bossMaxHp) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6 select-none animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          onClick={handleCloseRaid}
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

      <div className={`grid gap-6 items-start ${import.meta.env.PROD ? 'grid-cols-1 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
        {/* Lobby Details / Battlefield */}
        <div className={`${import.meta.env.PROD ? 'grid-cols-1' : 'md:col-span-2'} flex flex-col gap-6`}>
          {battleState === 'LOBBY' && (
            <div className="glass-panel p-6 border-white/5 bg-[#0b0f19]">
              <h3 className="m-0 text-white font-display text-base tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Users size={18} className="text-purple-400" />
                Raid Lobby: #{streamerName.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {import.meta.env.PROD ? (
                  <>Waiting for viewers. Tell your chat to type <span className="text-[#af52de] font-bold">!join</span> to enter the battlefield!</>
                ) : (
                  <>Waiting for viewers. Tell your chat to type <span className="text-[#af52de] font-bold">!join</span> to enter the battlefield! Or add mock viewers on the right console.</>
                )}
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

              <div className="flex flex-col gap-3 my-6 border-b border-white/5 pb-6">
                <span className="text-[10px] font-pixel text-neon-cyan uppercase tracking-widest">[ Sound Settings ]</span>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>MASTER VOLUME:</span>
                    <span className="text-white font-bold">{Math.round(masterVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={e => setMasterVolume(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>MUSIC VOLUME:</span>
                    <span className="text-white font-bold">{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={e => setMusicVolume(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
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
          )}

          {/* Joined Viewers List */}
          {battleState === 'LOBBY' && (
            <div className="glass-panel p-6 border-white/5">
              <h3 className="m-0 text-white font-display text-sm uppercase tracking-wider mb-4">
                LOBBY PARTICIPANTS ({lobby?.viewers.length || 0})
              </h3>

              {(!lobby || lobby.viewers.length === 0) ? (
                <div className="text-slate-500 italic text-xs py-4 text-center">
                  {import.meta.env.PROD ? (
                    'Lobby is empty. Waiting for viewers to join...'
                  ) : (
                    'Lobby is empty. Use the Twitch chat simulator on the right to mock players.'
                  )}
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
        {!import.meta.env.PROD && (
          <div className="md:col-span-1 flex flex-col gap-6">
            <TwitchConsole streamerName={streamerName} socket={socket} />
          </div>
        )}
      </div>

      {/* Viewport independent Fullscreen Results Modal */}
      {(battleState === 'VICTORY' || battleState === 'DEFEAT') && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-4 md:p-8 select-none animate-fadeIn">
          <div className="bg-[#0b0f19]/95 border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col items-center shadow-2xl relative animate-scaleUp">
            
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

            {/* MVP Crown and detailed stats table */}
            {recapStats && recapStats.length > 0 && (
              <div className="w-full max-w-xl mb-6">
                {/* MVP Crown Block */}
                <div className="bg-gradient-to-r from-yellow-950/35 via-yellow-900/20 to-yellow-950/35 border border-yellow-500/30 rounded-xl p-5 mb-5 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                  <span className="text-yellow-400 text-3xl block mb-1">👑</span>
                  <span className="text-[10px] font-pixel text-yellow-400 uppercase tracking-widest">[ Raid MVP ]</span>
                  <h4 className="m-0 text-white font-display text-base font-extrabold uppercase mt-1">
                    {recapStats[0].name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                    Class: <span style={{ color: recapStats[0].color }} className="font-bold">{recapStats[0].classType}</span> | Score: <span className="text-yellow-400 font-bold">{Math.round(recapStats[0].score)}</span>
                  </p>
                  <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Damage</span>
                      <span className="text-orange-400 font-bold">{recapStats[0].damageDealt}</span>
                    </div>
                    <div className="border-l border-white/5 pl-6">
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Healing</span>
                      <span className="text-emerald-400 font-bold">{recapStats[0].healingDone}</span>
                    </div>
                    <div className="border-l border-white/5 pl-6">
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Tanked</span>
                      <span className="text-blue-400 font-bold">{recapStats[0].damageTaken}</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Performance Table */}
                <div className="bg-[#05070a] border border-white/5 rounded-xl p-4 flex flex-col gap-3 text-left">
                  <span className="text-[10px] font-pixel text-neon-cyan uppercase tracking-widest">[ COMBAT STATS RECAP ]</span>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500 text-left">
                          <th className="pb-2 font-normal uppercase tracking-wider">Participant</th>
                          <th className="pb-2 font-normal uppercase tracking-wider text-right">DPS (Dealt)</th>
                          <th className="pb-2 font-normal uppercase tracking-wider text-right">Healing</th>
                          <th className="pb-2 font-normal uppercase tracking-wider text-right">Tanked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recapStats.map((p, idx) => (
                          <tr key={idx} className="border-b border-white/5 last:border-0">
                            <td className="py-2 text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                              {p.name}
                              {idx === 0 && <span className="text-yellow-400 text-[10px]" title="MVP">👑</span>}
                            </td>
                            <td className="py-2 text-right text-orange-400 font-bold">{p.damageDealt}</td>
                            <td className="py-2 text-right text-emerald-400 font-bold">{p.healingDone}</td>
                            <td className="py-2 text-right text-blue-400 font-bold">{p.damageTaken}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {rewardsList && Object.keys(rewardsList).length > 0 && (
              <div className="w-full max-w-md bg-[#05070a] border border-white/5 rounded-xl p-4 text-xs text-slate-400 text-left flex flex-col gap-3 mb-6">
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
                          {rew.inventoryFull ? (
                            <span className="text-red-500 font-bold border border-red-500/30 px-1 rounded bg-red-950/10 uppercase">
                              Inventory Full
                            </span>
                          ) : (
                            rew.itemDropped && (
                              <span className="text-orange-400 font-bold border border-orange-500/20 px-1 rounded bg-orange-950/10">
                                {rew.itemDropped.rarity} {rew.itemDropped.name}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {battleState === 'VICTORY' ? (
              <button
                onClick={() => {
                  setBattleState('LOBBY');
                  setRewardsList(null);
                  setRecapStats(null);
                }}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition mt-6 w-full"
              >
                Reset Lobby Room
              </button>
            ) : (
              <div className="flex gap-4 w-full mt-6">
                <button
                  onClick={handleRestartRaid}
                  className="flex-1 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition"
                >
                  Restart Raid
                </button>
                <button
                  onClick={handleCloseRaid}
                  className="flex-1 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-display font-bold uppercase tracking-wider transition border border-white/10"
                >
                  Close Raid & Exit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
