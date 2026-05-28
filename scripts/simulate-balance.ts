import { CLASSES, TALENTS, PASSIVE_SKILL_TREE, getArenaConfigForLevel } from '../shared/src/constants.js';
import { calculateCharacterStats, ItemData, getEnemyAttackRange } from '../shared/src/formulas.js';
import { updateUnitPhysics, performBasicAttack, castActiveSkill, CombatUnit, Projectile, FloatingText, Particle } from '../client/src/game/combatEngine.js';
import { soundManager } from '../client/src/game/soundManager.js';

// Setup browser/audio mock for soundManager
(global as any).window = {
  AudioContext: class {},
  webkitAudioContext: class {}
};

// Mock soundManager methods to avoid audio context errors in Node
soundManager.playHit = () => {};
soundManager.playCrit = () => {};
soundManager.playSkill = () => {};
soundManager.playVictory = () => {};
soundManager.playDefeat = () => {};

// Mock setTimeout to run callbacks synchronously/immediately
(global as any).setTimeout = (callback: (...args: any[]) => void, ms?: number, ...args: any[]) => {
  callback(...args);
  return {} as any;
};

// Heuristic talents list for DPS vs Tank builds for all 10 classes
const TALENTS_CONFIG: Record<string, { DPS: string[]; TANK: string[] }> = {
  WARRIOR: {
    DPS: ['t1_1', 't2_1', 't3_2', 't4_1', 't5_1', 't6_2', 't7_1', 't8_1', 't9_2'],
    TANK: ['t1_2', 't2_2', 't3_1', 't4_2', 't5_2', 't6_1', 't7_2', 't8_2', 't9_1']
  },
  MAGE: {
    DPS: ['t1_1', 't2_1', 't3_2', 't4_1', 't5_1', 't6_2', 't7_1', 't8_1', 't9_2'],
    TANK: ['t1_2', 't2_2', 't3_1', 't4_2', 't5_2', 't6_1', 't7_2', 't8_2', 't9_1']
  },
  CLERIC: {
    DPS: ['t1_2', 't2_2', 't3_2', 't4_2', 't5_1', 't6_2', 't7_1', 't8_1', 't9_2'],
    TANK: ['t1_1', 't2_1', 't3_1', 't4_1', 't5_2', 't6_1', 't7_2', 't8_2', 't9_1']
  },
  ROGUE: {
    DPS: ['t1_1', 't2_1', 't3_2', 't4_1', 't5_1', 't6_1', 't7_1', 't8_2', 't9_1'],
    TANK: ['t1_2', 't2_2', 't3_1', 't4_2', 't5_2', 't6_2', 't7_2', 't8_1', 't9_2']
  },
  RANGER: {
    DPS: ['t1_2', 't2_1', 't3_2', 't4_2', 't5_2', 't6_1', 't7_2', 't8_2', 't9_1'],
    TANK: ['t1_1', 't2_2', 't3_1', 't4_1', 't5_1', 't6_2', 't7_1', 't8_1', 't9_2']
  },
  VALKYRIE: {
    DPS: ['t1_2', 't2_1', 't3_2', 't4_1', 't5_2', 't6_2', 't7_1', 't8_1', 't9_1'],
    TANK: ['t1_1', 't2_2', 't3_1', 't4_2', 't5_1', 't6_1', 't7_2', 't8_2', 't9_2']
  },
  NECROMANCER: {
    DPS: ['t1_1', 't2_1', 't3_2', 't4_1', 't5_1', 't6_2', 't7_1', 't8_2', 't9_1'],
    TANK: ['t1_2', 't2_2', 't3_1', 't4_2', 't5_2', 't6_1', 't7_2', 't8_1', 't9_2']
  },
  MONK: {
    DPS: ['t1_1', 't2_1', 't3_2', 't4_1', 't5_1', 't6_2', 't7_1', 't8_2', 't9_1'],
    TANK: ['t1_2', 't2_2', 't3_1', 't4_2', 't5_2', 't6_1', 't7_2', 't8_1', 't9_2']
  },
  ALCHEMIST: {
    DPS: ['t1_2', 't2_1', 't3_2', 't4_1', 't5_1', 't6_1', 't7_1', 't8_2', 't9_1'],
    TANK: ['t1_1', 't2_2', 't3_1', 't4_2', 't5_2', 't6_2', 't7_2', 't8_1', 't9_2']
  },
  BARD: {
    DPS: ['t1_2', 't2_2', 't3_2', 't4_2', 't5_1', 't6_2', 't7_1', 't8_2', 't9_1'],
    TANK: ['t1_1', 't2_1', 't3_1', 't4_1', 't5_2', 't6_1', 't7_2', 't8_1', 't9_2']
  }
};

// BFS traversal of passive tree nodes
function getPassivesForBuild(buildType: 'DPS' | 'TANK', count: number): string[] {
  const allowedSectors = buildType === 'DPS' ? ['atk', 'speed', 'crit'] : ['def', 'life'];
  const allocated = new Set<string>();
  allocated.add('start');

  const queue: string[] = [];
  const startNode = PASSIVE_SKILL_TREE['start'];
  if (startNode) {
    for (const conn of startNode.connections) {
      const connNode = PASSIVE_SKILL_TREE[conn];
      if (connNode && allowedSectors.includes(connNode.type)) {
        queue.push(conn);
      }
    }
  }

  while (allocated.size < count && queue.length > 0) {
    const curr = queue.shift()!;
    if (allocated.has(curr)) continue;

    allocated.add(curr);

    const node = PASSIVE_SKILL_TREE[curr];
    if (node) {
      for (const conn of node.connections) {
        const connNode = PASSIVE_SKILL_TREE[conn];
        if (connNode && allowedSectors.includes(connNode.type) && !allocated.has(conn) && !queue.includes(conn)) {
          queue.push(conn);
        }
      }
    }
  }

  return Array.from(allocated);
}

// Generate standardized gear based on level and build
function getGearForBuild(level: number, buildType: 'DPS' | 'TANK'): ItemData[] {
  if (level === 10) {
    // Level 10 (Uncommon/Common)
    return [
      {
        name: 'Uncommon Weapon',
        slot: 'WEAPON',
        rarity: 'UNCOMMON',
        itemLevel: 10,
        baseAttack: Math.round(5 + 10 * 2.2), // 27
        baseDefense: 0,
        affixes: buildType === 'DPS' ? [{ type: 'attackPower', value: 2 }] : [],
        isEquipped: true
      },
      {
        name: 'Common Armor',
        slot: 'ARMOR',
        rarity: 'COMMON',
        itemLevel: 10,
        baseAttack: 0,
        baseDefense: Math.round(3 + 10 * 1.5), // 18
        affixes: buildType === 'TANK' ? [{ type: 'defense', value: 3 }] : [],
        isEquipped: true
      },
      {
        name: 'Common Accessory',
        slot: 'ACCESSORY',
        rarity: 'COMMON',
        itemLevel: 10,
        baseAttack: 6,
        baseDefense: 4,
        affixes: [],
        isEquipped: true
      }
    ];
  } else if (level === 50) {
    // Level 50 (Epic/Rare)
    return [
      {
        name: buildType === 'DPS' ? 'Epic Weapon' : 'Rare Weapon',
        slot: 'WEAPON',
        rarity: buildType === 'DPS' ? 'EPIC' : 'RARE',
        itemLevel: 50,
        baseAttack: Math.round(5 + 50 * 2.2), // 115
        baseDefense: 0,
        affixes: buildType === 'DPS'
          ? [{ type: 'attackPower', value: 10 }, { type: 'critChance', value: 0.08 }, { type: 'atkSpeedPct', value: 0.06 }]
          : [{ type: 'lifesteal', value: 0.04 }, { type: 'attackPower', value: 5 }],
        isEquipped: true
      },
      {
        name: buildType === 'TANK' ? 'Epic Armor' : 'Rare Armor',
        slot: 'ARMOR',
        rarity: buildType === 'TANK' ? 'EPIC' : 'RARE',
        itemLevel: 50,
        baseAttack: 0,
        baseDefense: Math.round(3 + 50 * 1.5), // 78
        affixes: buildType === 'TANK'
          ? [{ type: 'maxHp', value: 80 }, { type: 'defense', value: 15 }, { type: 'reflect', value: 0.05 }]
          : [{ type: 'maxHp', value: 50 }, { type: 'defense', value: 10 }],
        isEquipped: true
      },
      {
        name: 'Rare Accessory',
        slot: 'ACCESSORY',
        rarity: 'RARE',
        itemLevel: 50,
        baseAttack: 30,
        baseDefense: 20,
        affixes: buildType === 'TANK'
          ? [{ type: 'maxHp', value: 50 }, { type: 'defense', value: 8 }]
          : [{ type: 'maxHp', value: 30 }, { type: 'critChance', value: 0.04 }],
        isEquipped: true
      }
    ];
  } else {
    // Level 90 (Legendary/Epic)
    return [
      {
        name: buildType === 'DPS' ? 'Legendary Weapon' : 'Epic Weapon',
        slot: 'WEAPON',
        rarity: buildType === 'DPS' ? 'LEGENDARY' : 'EPIC',
        itemLevel: 90,
        baseAttack: Math.round(5 + 90 * 2.2), // 203
        baseDefense: 0,
        affixes: buildType === 'DPS'
          ? [{ type: 'attackPower', value: 25 }, { type: 'critChance', value: 0.15 }, { type: 'atkSpeedPct', value: 0.12 }, { type: 'lifesteal', value: 0.08 }]
          : [{ type: 'lifesteal', value: 0.08 }, { type: 'attackPower', value: 15 }, { type: 'atkSpeedPct', value: 0.06 }],
        isEquipped: true
      },
      {
        name: buildType === 'TANK' ? 'Legendary Armor' : 'Epic Armor',
        slot: 'ARMOR',
        rarity: buildType === 'TANK' ? 'LEGENDARY' : 'EPIC',
        itemLevel: 90,
        baseAttack: 0,
        baseDefense: Math.round(3 + 90 * 1.5), // 138
        affixes: buildType === 'TANK'
          ? [{ type: 'maxHp', value: 250 }, { type: 'defense', value: 45 }, { type: 'reflect', value: 0.12 }, { type: 'physRes', value: 0.20 }]
          : [{ type: 'maxHp', value: 150 }, { type: 'defense', value: 25 }, { type: 'physRes', value: 0.15 }],
        isEquipped: true
      },
      {
        name: buildType === 'TANK' ? 'Epic Accessory' : 'Epic Accessory',
        slot: 'ACCESSORY',
        rarity: 'EPIC',
        itemLevel: 90,
        baseAttack: 54,
        baseDefense: 36,
        affixes: buildType === 'TANK'
          ? [{ type: 'maxHp', value: 150 }, { type: 'defense', value: 20 }, { type: 'reflect', value: 0.06 }]
          : [{ type: 'maxHp', value: 100 }, { type: 'critChance', value: 0.08 }, { type: 'atkSpeedPct', value: 0.06 }],
        isEquipped: true
      }
    ];
  }
}

// Generate wave enemies using formulas matching SoloMap.tsx
function spawnEnemiesForWave(waveNum: number, mapLevel: number): CombatUnit[] {
  const enemyCount = 2 + waveNum;
  const baseEnemyHp = Math.round(30 + mapLevel * 12 + Math.pow(mapLevel, 2) * 0.4 + waveNum * 5);
  const baseEnemyAtk = Math.round(3.5 + mapLevel * 0.8 + Math.pow(mapLevel, 1.5) * 0.03 + waveNum * 0.6);

  const arena = getArenaConfigForLevel(mapLevel);

  const list: CombatUnit[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const enemyIndex = i % arena.enemyNames.length;
    const baseName = arena.enemyNames[enemyIndex];
    const name = `${baseName} lvl${waveNum}`;
    
    const spriteType = arena.enemySprites ? arena.enemySprites[enemyIndex] : arena.enemySprite;

    const range = getEnemyAttackRange(name, spriteType);

    list.push({
      id: `enemy_${waveNum}_${i}`,
      isPlayer: false,
      name,
      x: 950 + Math.random() * 150,
      y: 100 + (i * 400) / enemyCount + (Math.random() * 30 - 15),
      maxHp: baseEnemyHp,
      hp: baseEnemyHp,
      speed: 55 + mapLevel * 2,
      attackPower: baseEnemyAtk,
      critChance: 0.05,
      critMult: 1.5,
      atkSpeed: 0.75 + mapLevel * 0.02,
      attackRange: range,
      color: '#ff3b30',
      atkTimer: Math.random() * 1.5,
      skillTimer: 0,
      activeSkillCd: 999,
      stunTimer: 0,
      damageDealt: 0,
      healingDone: 0,
      damageTaken: 0,
      spriteType
    } as any);
  }
  return list;
}

// Run single battle simulation
function simulateBattle(
  classType: string,
  level: number,
  buildType: 'DPS' | 'TANK',
  mapLevel: number
): { success: boolean; time: number; hpPct: number } {
  // 1. Build Player
  const passivePoints = 1 + Math.min(50, Math.floor(level / 2));
  const passives = getPassivesForBuild(buildType, passivePoints);
  const maxTier = Math.floor(level / 10);
  const selectedTalents = TALENTS_CONFIG[classType][buildType].slice(0, maxTier);
  const gear = getGearForBuild(level, buildType);
  const stats = calculateCharacterStats(classType, level, selectedTalents, passives, gear);

  const player: CombatUnit = {
    id: 'player',
    name: `${classType}`,
    isPlayer: true,
    x: 100,
    y: 300,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    attackPower: stats.attackPower,
    defense: stats.defense,
    attackRange: classType === 'RANGER' ? 220 : (classType === 'MAGE' ? 180 : 40),
    atkSpeed: stats.atkSpeed,
    atkTimer: 0,
    skillTimer: 0,
    activeSkillCd: CLASSES[classType].activeSkill.cooldown * (1 - stats.cdr),
    stunTimer: 0,
    speed: stats.moveSpeed,
    color: CLASSES[classType].color,
    classType,
    isHealer: classType === 'CLERIC',
    critChance: stats.critChance,
    critMult: stats.critMult,
    lifesteal: stats.lifesteal,
    reflect: stats.reflect,
    selectedTalents,
    fireRes: stats.fireRes,
    coldRes: stats.coldRes,
    poisonRes: stats.poisonRes,
    physRes: stats.physRes,
    damageDealt: 0,
    healingDone: 0,
    damageTaken: 0,
    healPower: stats.healPower
  };

  let units: CombatUnit[] = [player];
  let wave = 1;
  let waveEnemies = spawnEnemiesForWave(wave, mapLevel);
  units.push(...waveEnemies);

  let timeElapsed = 0;
  const dt = 0.05; // 20 frames per second
  const maxTime = 120; // 2 minutes timeout to prevent infinite loops

  // Recap structures required by combat engine
  const recap = {
    shakeTimer: 0,
    shakeIntensity: 0,
    playerDamageDealt: 0,
    playerDamageTaken: 0,
    playerHealingDone: 0
  };
  const projectiles: Projectile[] = [];
  const floatingTexts: FloatingText[] = [];
  const particles: Particle[] = [];

  while (timeElapsed < maxTime) {
    timeElapsed += dt;

    // 1. Remove dead units (except player, whose death stops the loop)
    units = units.filter(u => u.isPlayer || u.hp > 0);

    // 2. Check if all wave enemies are dead
    const aliveEnemies = units.filter(u => !u.isPlayer && u.hp > 0);
    if (aliveEnemies.length === 0) {
      if (wave < 3) {
        wave += 1;
        waveEnemies = spawnEnemiesForWave(wave, mapLevel);
        units.push(...waveEnemies);
      } else {
        // Victory!
        return { success: true, time: timeElapsed, hpPct: player.hp / player.maxHp };
      }
    }

    // 3. Check if player is dead
    if (player.hp <= 0) {
      return { success: false, time: timeElapsed, hpPct: 0 };
    }

    // 4. Update combat physics and behaviors
    units.forEach(unit => {
      if (unit.hp <= 0) return;

      if (unit.stunTimer > 0) {
        unit.stunTimer -= dt;
        return; // Stunned, cannot act
      }

      // Find target
      let target: CombatUnit | null = null;
      if (unit.isPlayer) {
        // Nearest enemy
        let minDist = 9999;
        units.forEach(u => {
          if (!u.isPlayer && u.hp > 0) {
            const dist = Math.hypot(u.x - unit.x, u.y - unit.y);
            if (dist < minDist) {
              minDist = dist;
              target = u;
            }
          }
        });
      } else {
        // Enemy targets player
        target = player;
      }

      if (target) {
        const dist = Math.hypot(target.x - unit.x, target.y - unit.y);

        // Cooldown tick
        if (unit.atkTimer > 0) unit.atkTimer -= dt;
        if (unit.skillTimer > 0) unit.skillTimer -= dt;

        const alliesList = units.filter(other => other.isPlayer === unit.isPlayer);
        const enemiesList = units.filter(other => other.isPlayer !== unit.isPlayer);

        if (dist <= unit.attackRange) {
          // Perform basic attack
          if (unit.atkTimer <= 0) {
            performBasicAttack(unit, target, dt, recap, projectiles, floatingTexts, particles, 0.1);
          }

          // Perform active skill (players only)
          if (unit.isPlayer && unit.skillTimer <= 0) {
            castActiveSkill(unit, target, alliesList, enemiesList, recap, projectiles, floatingTexts, particles, 0.1);
          }
        } else {
          // Move towards target
          updateUnitPhysics(unit, target, alliesList, dt, 1200, 600);
        }
      }
    });
  }

  // Timeout (failure)
  return { success: false, time: timeElapsed, hpPct: player.hp / player.maxHp };
}

// Perform sweep for a given Class, Level, Build
function runSweep(
  classType: string,
  level: number,
  buildType: 'DPS' | 'TANK',
  runs = 50
) {
  // Map Level 2 (10), 10 (50), 18 (90)
  const mapLevel = level === 10 ? 2 : (level === 50 ? 10 : 18);

  let victories = 0;
  let totalTtk = 0;
  let totalHpPct = 0;

  for (let i = 0; i < runs; i++) {
    const res = simulateBattle(classType, level, buildType, mapLevel);
    if (res.success) {
      victories += 1;
      totalTtk += res.time;
      totalHpPct += res.hpPct;
    }
  }

  const successRate = victories / runs;
  const avgTtk = victories > 0 ? totalTtk / victories : 0;
  const avgHpPct = victories > 0 ? totalHpPct / victories : 0;

  return { successRate, avgTtk, avgHpPct };
}

// Main execution function
function main() {
  const classes = Object.keys(CLASSES);
  const levels = [10, 50, 90];
  const builds: Array<'DPS' | 'TANK'> = ['DPS', 'TANK'];

  console.log('Starting local balance simulation sweeps...');
  console.log('Runs per configuration: 50');
  console.log('| Class | Level | Build | Success Rate | Avg TTK (s) | Avg HP % |');
  console.log('|---|---|---|---|---|---|');

  interface Result {
    classType: string;
    level: number;
    buildType: 'DPS' | 'TANK';
    successRate: number;
    avgTtk: number;
    avgHpPct: number;
  }

  const results: Result[] = [];

  for (const c of classes) {
    for (const lvl of levels) {
      for (const b of builds) {
        const res = runSweep(c, lvl, b);
        console.log(`| ${c} | ${lvl} | ${b} | ${(res.successRate * 100).toFixed(0)}% | ${res.avgTtk.toFixed(1)}s | ${(res.avgHpPct * 100).toFixed(0)}% |`);
        results.push({ classType: c, level: lvl, buildType: b, ...res });
      }
    }
  }

  // Calculate averages per tier level and build type to check balance boundaries (+/- 15% window)
  console.log('\n### Analysis by Level Tier & Build Type');
  for (const lvl of levels) {
    console.log(`\n#### Level ${lvl} Tier`);
    for (const b of builds) {
      const tierBuildResults = results.filter(r => r.level === lvl && r.buildType === b);
      const avgTtk = tierBuildResults.reduce((acc, r) => acc + r.avgTtk, 0) / tierBuildResults.length;
      const avgSuccess = tierBuildResults.reduce((acc, r) => acc + r.successRate, 0) / tierBuildResults.length;

      console.log(`\n**${b} Build Averages:** Success Rate: ${(avgSuccess * 100).toFixed(0)}%, TTK: ${avgTtk.toFixed(1)}s`);

      const lowerBoundTtk = avgTtk * 0.85;
      const upperBoundTtk = avgTtk * 1.15;
      const lowerBoundSuccess = Math.max(0, avgSuccess - 0.15);
      const upperBoundSuccess = Math.min(1.0, avgSuccess + 0.15);

      console.log(`- Balance Boundaries (15%): Success [${(lowerBoundSuccess * 100).toFixed(0)}% - ${(upperBoundSuccess * 100).toFixed(0)}%], TTK [${lowerBoundTtk.toFixed(1)}s - ${upperBoundTtk.toFixed(1)}s]`);

      // Flag outliers
      const outliers: string[] = [];
      for (const r of tierBuildResults) {
        const isOutlierSuccess = r.successRate < lowerBoundSuccess || r.successRate > upperBoundSuccess;
        const isOutlierTtk = r.successRate > 0 && (r.avgTtk < lowerBoundTtk || r.avgTtk > upperBoundTtk);

        if (isOutlierSuccess || isOutlierTtk) {
          const reasons: string[] = [];
          if (isOutlierSuccess) reasons.push(`Success Rate (${(r.successRate * 100).toFixed(0)}%)`);
          if (isOutlierTtk) reasons.push(`TTK (${r.avgTtk.toFixed(1)}s)`);
          outliers.push(`  - ${r.classType}: Out of bounds in ${reasons.join(', ')}`);
        }
      }

      if (outliers.length > 0) {
        console.log('- **Outliers Found:**');
        outliers.forEach(o => console.log(o));
      } else {
        console.log('- **All classes are balanced for this configuration.**');
      }
    }
  }
}

main();
