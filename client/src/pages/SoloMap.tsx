import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';
import { calculateCharacterStats } from '../game/formulas';
import { CLASSES } from '../game/constants';
import { getDistance, getDirection, seek } from '../game/physics';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { drawPixelSprite } from '../game/sprites';

interface SoloMapProps {
  character: any;
  mapLevel: number;
  onUpdateCharacter: (char: any) => void;
  onBackToDashboard: () => void;
}

interface CombatUnit {
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
  // CD timers
  atkTimer: number;
  skillTimer: number;
  activeSkillCd: number;
  // States
  stunTimer: number;
  isHealer?: boolean;
}

interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  isCrit: boolean;
}

export const SoloMap: React.FC<SoloMapProps> = ({
  character,
  mapLevel,
  onUpdateCharacter,
  onBackToDashboard
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [battleState, setBattleState] = useState<'PREP' | 'FIGHTING' | 'VICTORY' | 'DEFEAT'>('PREP');
  const [wave, setWave] = useState(1);
  const [xpEarned, setXpEarned] = useState(0);
  const [goldEarned, setGoldEarned] = useState(0);
  const [itemsDropped, setItemsDropped] = useState<any[]>([]);
  const [totalKills, setTotalKills] = useState(0);
  const [reporting, setReporting] = useState(false);

  // References to keep data accessible in the requestAnimationFrame loop
  const stateRef = useRef<{
    units: CombatUnit[];
    particles: VisualParticle[];
    floatingTexts: FloatingText[];
    wave: number;
    kills: number;
    xpGained: number;
    goldGained: number;
    battleState: 'PREP' | 'FIGHTING' | 'VICTORY' | 'DEFEAT';
    playerDamageDealt: number;
    playerDamageTaken: number;
    playerHealingDone: number;
  }>({
    units: [],
    particles: [],
    floatingTexts: [],
    wave: 1,
    kills: 0,
    xpGained: 0,
    goldGained: 0,
    battleState: 'PREP',
    playerDamageDealt: 0,
    playerDamageTaken: 0,
    playerHealingDone: 0
  });

  const equipped = character.items.filter((item: any) => item.isEquipped);
  const stats = calculateCharacterStats(
    character.class,
    character.level,
    JSON.parse(character.talents || '[]'),
    JSON.parse(character.passives || '[]'),
    equipped
  );

  // Initialize Battle
  const initBattle = () => {
    const classConfig = CLASSES[character.class];

    // Configure Player Unit
    const playerUnit: CombatUnit = {
      id: 'player',
      isPlayer: true,
      name: character.user.displayName,
      x: 100,
      y: 200,
      maxHp: stats.maxHp,
      hp: stats.maxHp,
      speed: stats.moveSpeed,
      attackPower: stats.attackPower,
      critChance: stats.critChance,
      critMult: stats.critMult,
      atkSpeed: stats.atkSpeed,
      attackRange: character.class === 'RANGER' ? 220 : (character.class === 'MAGE' ? 180 : 40),
      color: classConfig.color,
      classType: character.class,
      atkTimer: 0,
      skillTimer: 0,
      activeSkillCd: classConfig.activeSkill.cooldown * (1 - stats.cdr),
      stunTimer: 0,
      isHealer: character.class === 'CLERIC'
    };

    stateRef.current = {
      units: [playerUnit],
      particles: [],
      floatingTexts: [],
      wave: 1,
      kills: 0,
      xpGained: 0,
      goldGained: 0,
      battleState: 'FIGHTING',
      playerDamageDealt: 0,
      playerDamageTaken: 0,
      playerHealingDone: 0
    };

    setWave(1);
    setTotalKills(0);
    setXpEarned(0);
    setGoldEarned(0);
    setItemsDropped([]);
    setBattleState('FIGHTING');
    
    spawnEnemies(1);
  };

  // Spawn enemy wave
  const spawnEnemies = (waveNum: number) => {
    const enemyCount = 2 + waveNum;
    const baseEnemyHp = 30 + mapLevel * 12 + waveNum * 5;
    const baseEnemyAtk = 4 + mapLevel * 1.5 + waveNum * 0.8;

    const newEnemies: CombatUnit[] = [];

    for (let i = 0; i < enemyCount; i++) {
      let name = `Goblin Scout`;
      let spriteType = 'GOBLIN';

      if (mapLevel < 5) {
        name = i % 2 === 0 ? `Goblin Scout v${waveNum}` : `Goblin Raider v${waveNum}`;
        spriteType = 'GOBLIN';
      } else if (mapLevel < 10) {
        name = i % 2 === 0 ? `Spitting Adder v${waveNum}` : `Slither Viper v${waveNum}`;
        spriteType = 'SNAKE';
      } else if (mapLevel < 15) {
        name = i % 2 === 0 ? `Orc Grunt v${waveNum}` : `Orc Berserker v${waveNum}`;
        spriteType = 'ORC';
      } else {
        name = i % 2 === 0 ? `Skeletal Guard v${waveNum}` : `Lich Acolyte v${waveNum}`;
        spriteType = 'LICH';
      }

      newEnemies.push({
        id: `enemy_${waveNum}_${i}`,
        isPlayer: false,
        name,
        x: 600 + Math.random() * 120,
        y: 80 + (i * 300) / enemyCount + (Math.random() * 20 - 10),
        maxHp: baseEnemyHp,
        hp: baseEnemyHp,
        speed: 55 + mapLevel * 2,
        attackPower: baseEnemyAtk,
        critChance: 0.05,
        critMult: 1.5,
        atkSpeed: 0.75 + mapLevel * 0.02,
        attackRange: 35,
        color: '#ff3b30', // glowing enemy neon red
        atkTimer: Math.random() * 1.5, // stagger attack times
        skillTimer: 0,
        activeSkillCd: 999, // enemies don't have active skills in solo maps
        stunTimer: 0,
        spriteType
      } as any);
    }

    stateRef.current.units = [
      stateRef.current.units.find(u => u.isPlayer)!, // Keep player
      ...newEnemies
    ];
  };

  // Trigger floating text
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

  // Trigger particles
  const addExplosion = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 3;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color,
        size: 1 + Math.random() * 2,
        alpha: 1.0,
        life: 30 + Math.random() * 20
      });
    }
  };

  // Submit battle results to backend
  const handleReportResults = async () => {
    if (reporting) return;
    setReporting(true);

    const { xpGained, goldGained, kills } = stateRef.current;

    try {
      const data = await apiFetch('/character/report-solo-battle', {
        method: 'POST',
        body: JSON.stringify({
          xpGained,
          goldGained,
          countOfKills: kills,
          mapLevel
        })
      });

      onUpdateCharacter(data.character);
      setItemsDropped(data.droppedItems || []);
      setXpEarned(data.gainedXp);
      setGoldEarned(data.gainedGold);
    } catch (err: any) {
      alert(`Cheat Protection Alert: ${err.message}`);
    } finally {
      setReporting(false);
    }
  };

  // Main Canvas animation & physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000); // Caps DT to prevent huge jumps on tab changes
      lastTime = time;

      // Draw themed background based on map level
      if (mapLevel < 5) {
        // Grassy forest
        ctx.fillStyle = '#08170e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f2919';
        for (let i = 0; i < 25; i++) {
          ctx.fillRect((i * 47) % canvas.width, (i * 31) % canvas.height, 8, 3);
          ctx.fillRect((i * 47) % canvas.width + 3, (i * 31) % canvas.height - 3, 2, 6);
        }
      } else if (mapLevel < 10) {
        // Poison Caves
        ctx.fillStyle = '#0d0714';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#a855f7';
        for (let i = 0; i < 15; i++) {
          const px = (i * 73) % canvas.width;
          const py = (i * 29) % canvas.height;
          ctx.fillRect(px, py, 3, 3);
          ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
          ctx.beginPath();
          ctx.arc(px + 1.5, py + 1.5, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#a855f7';
        }
      } else if (mapLevel < 15) {
        // Ancient Ruins
        ctx.fillStyle = '#171412';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#24201e';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < canvas.width; x += 60) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 60) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
      } else {
        // Volcano Lava River
        ctx.fillStyle = '#0a0807';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 60);
        ctx.bezierCurveTo(canvas.width / 3, canvas.height - 100, (canvas.width * 2) / 3, canvas.height - 30, canvas.width, canvas.height - 70);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      const s = stateRef.current;

      if (s.battleState === 'FIGHTING') {
        const player = s.units.find(u => u.isPlayer);
        const enemies = s.units.filter(u => !u.isPlayer);

        if (!player) {
          s.battleState = 'DEFEAT';
          setBattleState('DEFEAT');
          handleReportResults();
        } else if (enemies.length === 0) {
          // All enemies dead! Advance wave or win
          if (s.wave >= 3) {
            s.battleState = 'VICTORY';
            setBattleState('VICTORY');
            confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
            handleReportResults();
          } else {
            s.wave += 1;
            setWave(s.wave);
            spawnEnemies(s.wave);
          }
        } else {
          // 1. UPDATE PLAYERS & ENEMIES
          s.units.forEach(unit => {
            if (unit.stunTimer > 0) {
              unit.stunTimer -= dt;
              return; // Stunned, cannot act
            }

            // Find target
            let target: CombatUnit | null = null;
            if (unit.isPlayer) {
              // Pathfind to nearest enemy
              let minDist = 9999;
              enemies.forEach(e => {
                const dist = getDistance(unit, e);
                if (dist < minDist) {
                  minDist = dist;
                  target = e;
                }
              });
            } else {
              // Pathfind to player
              target = player;
            }

            if (target) {
              const dist = getDistance(unit, target);

              // Cooldown tick
              if (unit.atkTimer > 0) unit.atkTimer -= dt;
              if (unit.skillTimer > 0) unit.skillTimer -= dt;

              // Collision separation: keep distance from other allies
              let steerX = 0;
              let steerY = 0;
              s.units.forEach(other => {
                if (other.id !== unit.id && other.isPlayer === unit.isPlayer) {
                  const oDist = getDistance(unit, other);
                  if (oDist < 25) {
                    const dir = getDirection(other, unit);
                    steerX += dir.x * 30 * dt;
                    steerY += dir.y * 30 * dt;
                  }
                }
              });

              // Attack or Move
              if (dist <= unit.attackRange) {
                // Perform Basic attack on cooldown
                if (unit.atkTimer <= 0) {
                  unit.atkTimer = 1.0 / unit.atkSpeed;

                  const isCrit = Math.random() < unit.critChance;
                  const rawDmg = unit.attackPower * (isCrit ? unit.critMult : 1.0);
                  const finalDmg = Math.max(1, Math.round(rawDmg - (target.isPlayer ? stats.defense : 0) * 0.1));

                  target.hp = Math.max(0, target.hp - finalDmg);
                  if (unit.isPlayer) {
                    s.playerDamageDealt += finalDmg;
                  } else {
                    s.playerDamageTaken += finalDmg;
                  }

                  // Flash attack laser
                  ctx.strokeStyle = unit.color;
                  ctx.lineWidth = unit.isPlayer ? 2 : 1;
                  ctx.beginPath();
                  ctx.moveTo(unit.x, unit.y);
                  ctx.lineTo(target.x, target.y);
                  ctx.stroke();

                  addExplosion(target.x, target.y, unit.color, 4);
                  addFloatingText(target.x, target.y - 10, `${finalDmg}`, isCrit ? '#ff9500' : '#ffffff', isCrit);

                  // Rogue poison talent proc
                  const selectedTalents: string[] = JSON.parse(character.talents || '[]');
                  if (unit.isPlayer && unit.classType === 'ROGUE' && selectedTalents.includes('t1_2') && isCrit) {
                    // Poison triggers extra floating poison dots
                    setTimeout(() => {
                      if (target) {
                        target.hp = Math.max(0, target.hp - 10);
                        s.playerDamageDealt += 10;
                        addFloatingText(target.x, target.y - 20, '10 (Poison)', '#af52de');
                      }
                    }, 1000);
                  }

                  // Heals lifesteal
                  if (unit.isPlayer && stats.lifesteal > 0) {
                    const heal = Math.round(finalDmg * stats.lifesteal);
                    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
                    s.playerHealingDone += heal;
                  }

                  // Reflect damage
                  if (target.isPlayer && stats.reflect > 0) {
                    const refl = Math.round(finalDmg * stats.reflect);
                    unit.hp = Math.max(0, unit.hp - refl);
                    s.playerDamageDealt += refl;
                    addFloatingText(unit.x, unit.y - 12, `${refl} (Reflect)`, '#af52de');
                  }
                }

                // Cast Active skills on cooldown
                if (unit.isPlayer && unit.skillTimer <= 0) {
                  unit.skillTimer = unit.activeSkillCd;

                  // Visual cast effects
                  addExplosion(unit.x, unit.y, '#ffffff', 20);

                  if (unit.classType === 'WARRIOR') {
                    // Shield bash: stun target
                    target.stunTimer = 1.5;
                    const dmg = Math.round(unit.attackPower * 2.0);
                    target.hp = Math.max(0, target.hp - dmg);
                    s.playerDamageDealt += dmg;
                    addFloatingText(target.x, target.y - 20, `${dmg} (Shield Bash Stun!)`, '#ff3b30');
                  } else if (unit.classType === 'MAGE') {
                    // Fireball AoE: hit target and adjacent enemies
                    const dmg = Math.round(unit.attackPower * 2.5);
                    target.hp = Math.max(0, target.hp - dmg);
                    s.playerDamageDealt += dmg;
                    addFloatingText(target.x, target.y - 25, `${dmg} (Fireball AoE)`, '#00d8ff', true);
                    
                    // Hit others
                    enemies.forEach(e => {
                      if (e.id !== target!.id && getDistance(target!, e) < 100) {
                        const spl = Math.round(dmg * 0.6);
                        e.hp = Math.max(0, e.hp - spl);
                        s.playerDamageDealt += spl;
                        addFloatingText(e.x, e.y - 15, `${spl}`, '#00d8ff');
                      }
                    });
                  } else if (unit.classType === 'CLERIC') {
                    // Holy Nova: heal player, damage all enemies in range
                    const heal = Math.round(stats.healPower * 3.0);
                    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
                    s.playerHealingDone += heal;
                    addFloatingText(unit.x, unit.y - 20, `+${heal} (Holy Nova)`, '#ffcc00');

                    enemies.forEach(e => {
                      if (getDistance(unit, e) < 140) {
                        const dmg = Math.round(unit.attackPower * 1.5);
                        e.hp = Math.max(0, e.hp - dmg);
                        s.playerDamageDealt += dmg;
                        addFloatingText(e.x, e.y - 15, `${dmg}`, '#ffcc00');
                      }
                    });
                  } else if (unit.classType === 'ROGUE') {
                    // Blade Dance: multi hit
                    const dmg = Math.round(unit.attackPower * 0.7);
                    for (let strike = 0; strike < 5; strike++) {
                      setTimeout(() => {
                        if (target && target.hp > 0) {
                          target.hp = Math.max(0, target.hp - dmg);
                          s.playerDamageDealt += dmg;
                          addFloatingText(target.x + (Math.random() * 20 - 10), target.y - 15, `${dmg}`, '#af52de');
                        }
                      }, strike * 120);
                    }
                  } else if (unit.classType === 'RANGER') {
                    // Arrow Rain AoE
                    const dmg = Math.round(unit.attackPower * 1.8);
                    enemies.forEach(e => {
                      if (getDistance(target!, e) < 80) {
                        e.hp = Math.max(0, e.hp - dmg);
                        s.playerDamageDealt += dmg;
                        addFloatingText(e.x, e.y - 15, `${dmg} (Arrow Rain)`, '#34c759');
                      }
                    });
                  }
                }
              } else {
                // Seek target
                const nextPos = seek(unit, target, unit.speed, dt);
                unit.x = nextPos.x + steerX;
                unit.y = nextPos.y + steerY;
              }
            }
          });

          // Check for dead enemies and award local values
          s.units = s.units.filter(u => {
            if (u.hp <= 0) {
              if (!u.isPlayer) {
                s.kills += 1;
                setTotalKills(s.kills);
                // Accumulate loot XP/gold
                s.xpGained += mapLevel * 15;
                s.goldGained += mapLevel * 1;
                addExplosion(u.x, u.y, '#ff3b30', 25);
              }
              return false;
            }
            return true;
          });
        }
      }

      // 2. RENDER UNITS
      s.units.forEach(unit => {
        // Draw the 2D retro pixel-art sprite
        if (unit.isPlayer) {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'WARRIOR', 2.4, false, unit.color);
        } else {
          drawPixelSprite(ctx, unit.x, unit.y, (unit as any).spriteType || 'GOBLIN', 2.4, true);
        }

        // Stunned indicator (circles above head)
        if (unit.stunTimer > 0) {
          ctx.strokeStyle = '#007aff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(unit.x, unit.y - 22, 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.shadowBlur = 0; // Reset

        // Name
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px font-display, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name, unit.x, unit.y - 28);

        // Health Bar
        const barW = 28;
        const barH = 3.5;
        const bx = unit.x - barW / 2;
        const by = unit.y - 22;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx, by, barW, barH);

        const hpPct = Math.max(0, unit.hp / unit.maxHp);
        ctx.fillStyle = unit.isPlayer ? '#34c759' : '#ff3b30';
        ctx.fillRect(bx, by, barW * hpPct, barH);
      });

      // 3. UPDATE & RENDER PARTICLES
      s.particles = s.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.life -= 1;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return p.life > 0 && p.alpha > 0;
      });
      ctx.globalAlpha = 1.0; // Reset

      // 4. UPDATE & RENDER FLOATING TEXTS
      s.floatingTexts = s.floatingTexts.filter(ft => {
        ft.y -= 0.6;
        ft.life -= 1;

        ctx.fillStyle = ft.color;
        ctx.font = ft.isCrit ? '900 12px Orbitron, sans-serif' : '800 10px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);

        return ft.life > 0;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mapLevel]);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 select-none">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-display font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Abandon Run
        </button>

        <span className="text-xs text-slate-400 font-display">
          SOLO STAGE: LEVEL {mapLevel}
        </span>
      </div>

      {/* Main Canvas and HUD Panels */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Canvas Battlefield */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="relative border border-white/5 rounded-xl overflow-hidden shadow-2xl bg-[#06080d]">
            <canvas ref={canvasRef} width="760" height="400" className="w-full block aspect-[760/400]" />

            {/* Preparation Overlay */}
            {battleState === 'PREP' && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 text-center">
                <h3 className="m-0 text-white font-display text-lg tracking-wider">
                  PREPARATION LOBBY
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Your character is ready. Click below to begin the autobattle loop. Defeat 3 waves of enemies to secure your gold, XP, and potential loot drops!
                </p>
                <button
                  onClick={initBattle}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-display font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition duration-300"
                >
                  <Play size={14} />
                  Start Battle
                </button>
              </div>
            )}

            {/* Summary Overlay (Victory / Defeat) */}
            {(battleState === 'VICTORY' || battleState === 'DEFEAT') && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
                <h3
                  className={`m-0 font-display text-2xl tracking-widest ${
                    battleState === 'VICTORY' ? 'text-emerald-400' : 'text-red-500'
                  }`}
                >
                  {battleState === 'VICTORY' ? 'STAGE CLEAR' : 'CHARACTER DEFEATED'}
                </h3>
                <p className="text-slate-500 text-[10px] uppercase font-display tracking-widest mt-1 mb-6">
                  {battleState === 'VICTORY' ? 'Farming completed successfully!' : 'Character fell in battle.'}
                </p>

                {reporting ? (
                  <div className="text-slate-400 text-xs italic">Syncing loot drop outcomes with server database...</div>
                ) : (
                  <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    {/* Performance Recap Table */}
                    <div className="w-full bg-[#0b0f19]/95 border border-white/10 rounded-xl p-4 flex flex-col gap-3 select-none">
                      <span className="text-[10px] font-pixel text-neon-cyan uppercase tracking-widest text-left">[ COMBAT STATS RECAP ]</span>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] font-mono text-slate-300 border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-500 text-left">
                              <th className="pb-2 font-normal uppercase tracking-wider">Character</th>
                              <th className="pb-2 font-normal uppercase tracking-wider text-right">DPS (Dealt)</th>
                              <th className="pb-2 font-normal uppercase tracking-wider text-right">Healing</th>
                              <th className="pb-2 font-normal uppercase tracking-wider text-right">Tanked</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-white/5 last:border-0 text-left">
                              <td className="py-2 text-white font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CLASSES[character.class]?.color }} />
                                {character.user.displayName}
                              </td>
                              <td className="py-2 text-right text-orange-400 font-bold">{stateRef.current.playerDamageDealt}</td>
                              <td className="py-2 text-right text-emerald-400 font-bold">{stateRef.current.playerHealingDone}</td>
                              <td className="py-2 text-right text-blue-400 font-bold">{stateRef.current.playerDamageTaken}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Monsters Slain:</span>
                          <span className="text-white font-bold">{totalKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>XP Earned:</span>
                          <span className="text-emerald-400 font-bold">+{xpEarned} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gold Salvaged:</span>
                          <span className="text-yellow-400 font-bold">+{goldEarned} Gold</span>
                        </div>
                      </div>
                    </div>

                    {/* Dropped items */}
                    {itemsDropped.length > 0 && (
                      <div className="w-full">
                        <span className="block text-[9px] font-display text-slate-500 uppercase tracking-widest mb-2">
                          Loot Drops Discovered ({itemsDropped.length}):
                        </span>
                        <div className="flex justify-center gap-3">
                          {itemsDropped.map((item, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-2 bg-[#0b0f19] border rounded-lg text-xs font-semibold item-slot-glow rarity-${item.rarity}`}
                            >
                              <div className="text-white leading-tight font-display">{item.name}</div>
                              <div className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">
                                {item.slot} | Level {item.itemLevel}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 w-full">
                      <button
                        onClick={initBattle}
                        className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition"
                      >
                        Fight Again
                      </button>
                      <button
                        onClick={onBackToDashboard}
                        className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition"
                      >
                        Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right HUD Info */}
        <div className="flex flex-col gap-4 md:col-span-1 select-none">
          <div className="glass-panel p-4 border-white/5 flex flex-col gap-4 text-xs">
            <h4 className="m-0 text-white font-display text-xs tracking-wider uppercase border-b border-white/5 pb-2">
              RUN STATS
            </h4>

            <div className="flex justify-between">
              <span className="text-slate-400">Wave:</span>
              <span className="text-white font-bold">{wave} / 3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monsters slain:</span>
              <span className="text-white font-bold">{totalKills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">XP Accumulation:</span>
              <span className="text-emerald-400 font-bold">+{totalKills * mapLevel * 15}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gold Accumulation:</span>
              <span className="text-yellow-400 font-bold">+{totalKills * mapLevel * 1}</span>
            </div>

            <div className="p-3 bg-yellow-950/20 border border-yellow-900/20 text-yellow-500 rounded-lg leading-relaxed flex gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="text-[10px]">
                <span className="font-bold">Loot Capping:</span> Rare/Epic items can drop here, but Legendary drops require streamer raids!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
