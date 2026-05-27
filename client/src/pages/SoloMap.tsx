import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';
import { calculateCharacterStats, CLASSES, ARENA_CONFIGS } from 'shared';
import { soundManager } from '../game/soundManager';
import { getDistance } from '../game/physics';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
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

interface SoloMapProps {
  character: any;
  mapLevel: number;
  onUpdateCharacter: (char: any) => void;
  onBackToDashboard: () => void;
  showAlert: (message: string, title?: string) => void;
}

export const SoloMap: React.FC<SoloMapProps> = ({
  character,
  mapLevel,
  onUpdateCharacter,
  onBackToDashboard,
  showAlert
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentMapLevel = mapLevel;
  const [battleState, setBattleState] = useState<'PREP' | 'FIGHTING' | 'VICTORY' | 'DEFEAT'>('PREP');
  const [wave, setWave] = useState(1);
  const [xpEarned, setXpEarned] = useState(0);
  const [goldEarned, setGoldEarned] = useState(0);
  const [itemsDropped, setItemsDropped] = useState<any[]>([]);
  const [totalKills, setTotalKills] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [inventoryFull, setInventoryFull] = useState(false);

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
    shakeTimer: number;
    shakeIntensity: number;
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
    playerHealingDone: 0,
    shakeTimer: 0,
    shakeIntensity: 0
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
    const selectedTalents: string[] = JSON.parse(character.talents || '[]');
    
    let baseCd = classConfig.activeSkill.cooldown;
    if (character.class === 'WARRIOR') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t5_2')) baseCd += 2.0;
      if (selectedTalents.includes('t6_2')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_1')) baseCd -= 3.0;
    } else if (character.class === 'MAGE') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t6_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t10_2')) baseCd -= 2.5;
    } else if (character.class === 'CLERIC') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t5_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.0;
    } else if (character.class === 'ROGUE') {
      if (selectedTalents.includes('t2_2')) baseCd -= 1.5;
      if (selectedTalents.includes('t6_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.0;
    } else if (character.class === 'RANGER') {
      if (selectedTalents.includes('t1_2')) baseCd -= 1.5;
      if (selectedTalents.includes('t5_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t9_1')) baseCd -= 3.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 4.0;
    } else if (character.class === 'VALKYRIE') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t4_2')) baseCd -= 1.5;
      if (selectedTalents.includes('t9_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.0;
    } else if (character.class === 'NECROMANCER') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t4_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t6_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.0;
    } else if (character.class === 'MONK') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t4_2')) baseCd -= 1.5;
      if (selectedTalents.includes('t6_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.5;
    } else if (character.class === 'ALCHEMIST') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t6_1')) baseCd -= 1.5;
      if (selectedTalents.includes('t10_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.5;
    } else if (character.class === 'BARD') {
      if (selectedTalents.includes('t1_1')) baseCd -= 1.0;
      if (selectedTalents.includes('t4_2')) baseCd -= 1.5;
      if (selectedTalents.includes('t6_1')) baseCd -= 2.0;
      if (selectedTalents.includes('t10_2')) baseCd -= 3.5;
    }

    // Configure Player Unit
    const playerUnit: CombatUnit = {
      id: 'player',
      isPlayer: true,
      name: character.user.displayName,
      x: 150,
      y: 300,
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
      activeSkillCd: Math.max(1, baseCd * (1 - stats.cdr)),
      stunTimer: 0,
      isHealer: character.class === 'CLERIC',
      defense: stats.defense,
      lifesteal: stats.lifesteal,
      reflect: stats.reflect,
      fireRes: stats.fireRes,
      coldRes: stats.coldRes,
      poisonRes: stats.poisonRes,
      physRes: stats.physRes,
      selectedTalents
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
      playerHealingDone: 0,
      shakeTimer: 0,
      shakeIntensity: 0
    };

    setWave(1);
    setTotalKills(0);
    setXpEarned(0);
    setGoldEarned(0);
    setItemsDropped([]);
    setInventoryFull(false);
    setBattleState('FIGHTING');
    
    spawnEnemies(1);
    soundManager.startMusic();
  };

  // Spawn enemy wave
  const spawnEnemies = (waveNum: number) => {
    const enemyCount = 2 + waveNum;
    const baseEnemyHp = Math.round(30 + currentMapLevel * 15 + Math.pow(currentMapLevel, 2) * 0.8 + waveNum * 5);
    const baseEnemyAtk = Math.round(4 + currentMapLevel * 1.2 + Math.pow(currentMapLevel, 1.8) * 0.05 + waveNum * 0.8);

    const newEnemies: CombatUnit[] = [];

    const arena = ARENA_CONFIGS[currentMapLevel] || ARENA_CONFIGS[1];

    for (let i = 0; i < enemyCount; i++) {
      const name = i % 2 === 0
        ? `${arena.enemyNames[0]} v${waveNum}`
        : `${arena.enemyNames[1] || arena.enemyNames[0]} v${waveNum}`;
      const spriteType = arena.enemySprite;

      newEnemies.push({
        id: `enemy_${waveNum}_${i}`,
        isPlayer: false,
        name,
        x: 950 + Math.random() * 150,
        y: 100 + (i * 400) / enemyCount + (Math.random() * 30 - 15),
        maxHp: baseEnemyHp,
        hp: baseEnemyHp,
        speed: 55 + currentMapLevel * 2,
        attackPower: baseEnemyAtk,
        critChance: 0.05,
        critMult: 1.5,
        atkSpeed: 0.75 + currentMapLevel * 0.02,
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
          mapLevel: currentMapLevel,
          won: stateRef.current.battleState === 'VICTORY'
        })
      });

      onUpdateCharacter(data.character);
      setItemsDropped(data.droppedItems || []);
      setXpEarned(data.gainedXp);
      setGoldEarned(data.gainedGold);
      setInventoryFull(!!data.inventoryFull);
    } catch (err: any) {
      showAlert(`Cheat Protection Alert: ${err.message}`, 'SECURITY ALERT');
    } finally {
      setReporting(false);
    }
  };

  // Auto-start battle on component mount
  useEffect(() => {
    initBattle();
  }, []);

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

      // Draw themed background based on map level
      const arena = ARENA_CONFIGS[currentMapLevel] || ARENA_CONFIGS[1];
      drawProceduralBackground(ctx, canvas.width, canvas.height, arena);

      if (s.battleState === 'FIGHTING') {
        const player = s.units.find(u => u.isPlayer);
        const enemies = s.units.filter(u => !u.isPlayer);

        if (!player) {
          s.battleState = 'DEFEAT';
          setBattleState('DEFEAT');
          soundManager.playDefeat();
          handleReportResults();
        } else if (enemies.length === 0) {
          // All enemies dead! Advance wave or win
          if (s.wave >= 3) {
            s.battleState = 'VICTORY';
            setBattleState('VICTORY');
            confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
            soundManager.playVictory();
            handleReportResults();
          } else {
            s.wave += 1;
            setWave(s.wave);
            spawnEnemies(s.wave);
          }
        } else {
          // Update unit hit flash timers
          s.units.forEach(unit => {
            if (unit.flashTimer && unit.flashTimer > 0) {
              unit.flashTimer -= dt;
            }
          });

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

              const alliesList = s.units.filter(other => other.isPlayer === unit.isPlayer);
              const enemiesList = s.units.filter(other => other.isPlayer !== unit.isPlayer);

              // Attack or Move
              if (dist <= unit.attackRange) {
                // Perform Basic attack on cooldown
                if (unit.atkTimer <= 0) {
                  const dummyRecap = {
                    shakeTimer: s.shakeTimer,
                    shakeIntensity: s.shakeIntensity,
                    playerDamageDealt: s.playerDamageDealt,
                    playerDamageTaken: s.playerDamageTaken,
                    playerHealingDone: s.playerHealingDone
                  };
                  
                  if (unit.isPlayer) {
                    unit.defense = stats.defense;
                    unit.lifesteal = stats.lifesteal;
                    unit.reflect = stats.reflect;
                  }
                  if (target.isPlayer) {
                    target.defense = stats.defense;
                    target.lifesteal = stats.lifesteal;
                    target.reflect = stats.reflect;
                  }

                  const dummyProjectiles: any[] = [];
                  performBasicAttack(
                    unit,
                    target,
                    dt,
                    dummyRecap,
                    dummyProjectiles,
                    s.floatingTexts,
                    s.particles,
                    0.1
                  );
                  
                  if (dummyProjectiles.length > 0) {
                    ctx.strokeStyle = unit.color;
                    ctx.lineWidth = unit.isPlayer ? 2 : 1;
                    ctx.beginPath();
                    ctx.moveTo(unit.x, unit.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.stroke();
                  }

                  s.shakeTimer = dummyRecap.shakeTimer;
                  s.shakeIntensity = dummyRecap.shakeIntensity;
                  s.playerDamageDealt = dummyRecap.playerDamageDealt;
                  s.playerDamageTaken = dummyRecap.playerDamageTaken;
                  s.playerHealingDone = dummyRecap.playerHealingDone;

                  // Rogue poison talent proc
                  const selectedTalents: string[] = JSON.parse(character.talents || '[]');
                  const lastText = s.floatingTexts[s.floatingTexts.length - 1];
                  const wasCrit = lastText && lastText.isCrit;
                  if (unit.isPlayer && unit.classType === 'ROGUE' && selectedTalents.includes('t1_2') && wasCrit) {
                    setTimeout(() => {
                      if (target && target.hp > 0) {
                        target.hp = Math.max(0, target.hp - 10);
                        target.flashTimer = 0.1;
                        target.flashColor = '#af52de';
                        s.playerDamageDealt += 10;
                        addFloatingText(target.x, target.y - 20, '10 (Poison)', '#af52de');
                      }
                    }, 1000);
                  }
                }

                // Cast Active skills on cooldown
                if (unit.isPlayer && unit.skillTimer <= 0) {
                  const dummyRecap = {
                    shakeTimer: s.shakeTimer,
                    shakeIntensity: s.shakeIntensity,
                    playerDamageDealt: s.playerDamageDealt,
                    playerHealingDone: s.playerHealingDone
                  };
                  
                   unit.defense = stats.defense;
                  unit.lifesteal = stats.lifesteal;
                  unit.reflect = stats.reflect;

                  const dummyProjectiles: any[] = [];
                  castActiveSkill(
                    unit,
                    target,
                    alliesList,
                    enemiesList,
                    dummyRecap,
                    dummyProjectiles,
                    s.floatingTexts,
                    s.particles,
                    0.1
                  );

                  s.shakeTimer = dummyRecap.shakeTimer;
                  s.shakeIntensity = dummyRecap.shakeIntensity;
                  s.playerDamageDealt = dummyRecap.playerDamageDealt;
                  s.playerHealingDone = dummyRecap.playerHealingDone;
                }
              } else {
                updateUnitPhysics(unit, target, alliesList, dt, canvas.width, canvas.height);
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
                s.xpGained += currentMapLevel * 15;
                s.goldGained += currentMapLevel * 1;
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
        const uFlash = (unit.flashTimer && unit.flashTimer > 0) ? unit.flashColor : undefined;

        // Draw the 2D retro pixel-art sprite
        if (unit.isPlayer) {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'WARRIOR', 2.8, false, unit.color, uFlash);
        } else {
          drawPixelSprite(ctx, unit.x, unit.y, (unit as any).spriteType || 'GOBLIN', 2.8, true, undefined, uFlash);
        }

        // Stunned indicator (circles above head)
        if (unit.stunTimer > 0) {
          ctx.strokeStyle = '#007aff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(unit.x, unit.y - 25, 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.shadowBlur = 0; // Reset

        // Name
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px font-display, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name, unit.x, unit.y - 32);

        // Health Bar
        const barW = 32;
        const barH = 4;
        const bx = unit.x - barW / 2;
        const by = unit.y - 25;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx, by, barW, barH);

        const hpPct = Math.max(0, unit.hp / unit.maxHp);
        ctx.fillStyle = unit.isPlayer ? '#34c759' : '#ff3b30';
        ctx.fillRect(bx, by, barW * hpPct, barH);
      });

      // 3. UPDATE PARTICLES & TEXTS WITH ENGINE
      updateVisuals([], s.floatingTexts, s.particles, dt);

      // Render Particles
      s.particles = s.particles.filter(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return p.life > 0 && p.alpha > 0;
      });
      ctx.globalAlpha = 1.0; // Reset

      // Render Floating Texts
      s.floatingTexts = s.floatingTexts.filter(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = ft.isCrit ? '900 12px Orbitron, sans-serif' : '800 10px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);

        return ft.life > 0;
      });

      ctx.restore(); // Restore shake matrix

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      soundManager.stopMusic();
    };
  }, [mapLevel, battleState]);

  if (battleState === 'PREP') {
    return (
      <div className="fixed inset-0 bg-[#06080d] z-40 flex items-center justify-center font-display text-xs tracking-widest text-slate-500 uppercase select-none">
        Initializing Battle Simulation...
      </div>
    );
  }

  if (battleState === 'FIGHTING' || battleState === 'VICTORY' || battleState === 'DEFEAT') {
    return (
      <div className="fixed inset-0 bg-[#06080d] z-40 flex flex-col overflow-hidden select-none">
        {/* Widescreen Header */}
        <div className="h-14 border-b border-white/5 bg-[#090e1a] px-6 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-display flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SOLO ARENA: LEVEL {currentMapLevel} (WAVE {wave} / 3)
          </span>

          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-[10px] font-display font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg bg-black/25"
          >
            <ArrowLeft size={12} />
            Abandon Run
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
              Live Battle Stats
            </h4>

            {/* Live Metrics Table */}
            <div className="bg-[#0b0f19]/95 border border-white/10 rounded-xl p-3 flex flex-col gap-2 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between border-b border-white/5 pb-1 text-slate-500">
                <span>Metric</span>
                <span>Value</span>
              </div>
              <div className="flex justify-between">
                <span>Damage Dealt:</span>
                <span className="text-orange-400 font-bold">{stateRef.current.playerDamageDealt}</span>
              </div>
              <div className="flex justify-between">
                <span>Healing Done:</span>
                <span className="text-emerald-400 font-bold">{stateRef.current.playerHealingDone}</span>
              </div>
              <div className="flex justify-between">
                <span>Damage Taken:</span>
                <span className="text-blue-400 font-bold">{stateRef.current.playerDamageTaken}</span>
              </div>
            </div>

            <div className="flex-grow" />

            <div className="flex flex-col gap-2 text-xs text-slate-400 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span>Monsters Slain:</span>
                <span className="text-white font-bold">{totalKills}</span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-slate-300">
                <span>XP Gained:</span>
                <span className="text-emerald-400 font-bold">+{totalKills * currentMapLevel * 15}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Gold salvaged:</span>
                <span className="text-yellow-400 font-bold">+{totalKills * currentMapLevel * 1}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Results Modal */}
        {(battleState === 'VICTORY' || battleState === 'DEFEAT') && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-4 md:p-8 select-none animate-fadeIn">
            <div className="bg-[#0b0f19]/95 border border-white/10 rounded-2xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col items-center shadow-2xl relative animate-scaleUp">
              
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
                <div className="text-slate-400 text-xs italic py-4">Syncing loot drop outcomes with server database...</div>
              ) : (
                <div className="flex flex-col items-center gap-6 w-full">
                  {/* Performance Recap Table */}
                  <div className="w-full bg-[#05070a] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
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

                  {/* Inventory Full Warning */}
                  {inventoryFull && (
                    <div className="w-full p-3 bg-red-950/20 border border-red-900/40 text-red-500 rounded-lg text-xs leading-relaxed flex gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">⚠ Inventory Full (30/30)</span> - No loot could be awarded! Please free up space in your stash.
                      </div>
                    </div>
                  )}

                  {/* Dropped items */}
                  {itemsDropped.length > 0 && (
                    <div className="w-full">
                      <span className="block text-[9px] font-display text-slate-500 uppercase tracking-widest mb-2 text-left">
                        Loot Drops Discovered ({itemsDropped.length}):
                      </span>
                      <div className="flex flex-wrap justify-center gap-3">
                        {itemsDropped.map((item, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-2 bg-[#05070a] border rounded-lg text-xs font-semibold item-slot-glow rarity-${item.rarity}`}
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

                  <div className="flex gap-4 w-full mt-4">
                    <button
                      onClick={initBattle}
                      className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition font-bold"
                    >
                      Fight Again
                    </button>
                    <button
                      onClick={onBackToDashboard}
                      className="flex-1 py-2.5 bg-[#00d8ff] hover:bg-cyan-500 text-black rounded text-xs font-display font-bold uppercase tracking-wider transition font-bold"
                    >
                      Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
