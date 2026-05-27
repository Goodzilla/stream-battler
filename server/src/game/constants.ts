export interface ClassConfig {
  name: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseCritChance: number;      // e.g., 0.05 (5%)
  baseCritMult: number;        // e.g., 1.50 (150%)
  baseAtkSpeed: number;        // attacks per second, e.g. 0.8
  baseMoveSpeed: number;       // speed pixels per second
  baseHealPower: number;       // only Clerics make use of this by default
  color: string;               // color for retro-neon UI/canvas
  activeSkill: {
    name: string;
    cooldown: number;          // in seconds
    description: string;
  };
}

export const CLASSES: Record<string, ClassConfig> = {
  WARRIOR: {
    name: 'Warrior',
    baseHp: 180,
    baseAtk: 16,
    baseDef: 12,
    baseCritChance: 0.05,
    baseCritMult: 1.5,
    baseAtkSpeed: 0.9,
    baseMoveSpeed: 100,
    baseHealPower: 0,
    color: '#ff3b30', // neon red
    activeSkill: {
      name: 'Shield Bash',
      cooldown: 6,
      description: 'Deals 200% damage and stuns the target for 1.5s'
    }
  },
  MAGE: {
    name: 'Mage',
    baseHp: 100,
    baseAtk: 24,
    baseDef: 3,
    baseCritChance: 0.08,
    baseCritMult: 1.5,
    baseAtkSpeed: 0.75,
    baseMoveSpeed: 90,
    baseHealPower: 0,
    color: '#007aff', // neon blue
    activeSkill: {
      name: 'Fireball',
      cooldown: 5,
      description: 'Launches an explosive fire shell dealing 250% AoE magic damage'
    }
  },
  CLERIC: {
    name: 'Cleric',
    baseHp: 130,
    baseAtk: 14,
    baseDef: 8,
    baseCritChance: 0.05,
    baseCritMult: 1.5,
    baseAtkSpeed: 0.8,
    baseMoveSpeed: 95,
    baseHealPower: 15,
    color: '#ffcc00', // neon gold
    activeSkill: {
      name: 'Holy Nova',
      cooldown: 7,
      description: 'Heals all nearby allies for 300% heal power and deals 100% damage to adjacent enemies'
    }
  },
  ROGUE: {
    name: 'Rogue',
    baseHp: 110,
    baseAtk: 18,
    baseDef: 5,
    baseCritChance: 0.15,
    baseCritMult: 2.0, // higher base crit multiplier
    baseAtkSpeed: 1.3, // very fast
    baseMoveSpeed: 120,
    baseHealPower: 0,
    color: '#af52de', // neon purple
    activeSkill: {
      name: 'Blade Dance',
      cooldown: 8,
      description: 'Delivers a rapid flurry of 5 strikes, each dealing 60% physical damage with a +20% crit chance'
    }
  },
  RANGER: {
    name: 'Ranger',
    baseHp: 120,
    baseAtk: 17,
    baseDef: 6,
    baseCritChance: 0.10,
    baseCritMult: 1.6,
    baseAtkSpeed: 1.1,
    baseMoveSpeed: 110,
    baseHealPower: 0,
    color: '#34c759', // neon green
    activeSkill: {
      name: 'Arrow Rain',
      cooldown: 8,
      description: 'Fires a volley of arrows in an area, dealing 180% damage and slowing enemies by 30% for 3s'
    }
  }
};

export interface TalentConfig {
  id: string;
  name: string;
  description: string;
  tier: number; // 1: level 5, 2: level 10, 3: level 15, 4: level 20
  effects: Record<string, number>;
}

export const TALENTS: Record<string, Record<string, TalentConfig>> = {
  WARRIOR: {
    t1_1: { id: 't1_1', name: 'Juggernaut', description: '+20% Maximum Life, +5% Armor', tier: 1, effects: { maxHpPct: 0.20, armorPct: 0.05 } },
    t1_2: { id: 't1_2', name: 'Heavy Impact', description: 'Shield Bash stuns for 2.5s and deals 50% more damage', tier: 1, effects: { shieldBashStun: 1.0, shieldBashDmg: 0.5 } },
    t2_1: { id: 't2_1', name: 'Bloodthirst', description: 'Gain 10% Lifesteal on all physical attacks', tier: 2, effects: { lifesteal: 0.10 } },
    t2_2: { id: 't2_2', name: 'Challenger Aura', description: 'Taunt nearby enemies periodically, increasing defense by 15% for each enemy within close range', tier: 2, effects: { defensePct: 0.15 } },
    t3_1: { id: 't3_1', name: 'Retaliate', description: 'Reflect 15% of incoming damage back to attackers as physical damage', tier: 3, effects: { reflect: 0.15 } },
    t3_2: { id: 't3_2', name: 'Enrage', description: 'Attack speed increases by up to 30% based on missing health', tier: 3, effects: { lowHealthAtkSpeed: 0.30 } },
    t4_1: { id: 't4_1', name: 'Undying Stand', description: 'Upon taking fatal damage, survive with 1 HP and become immune to damage for 4s (120s cooldown)', tier: 4, effects: { undying: 1.0 } },
    t4_2: { id: 't4_2', name: 'Colossus', description: 'Deals 20% more damage and immunizes against slows and stuns', tier: 4, effects: { damagePct: 0.20, crowdControlImmune: 1.0 } }
  },
  MAGE: {
    t1_1: { id: 't1_1', name: 'Spellweaver', description: '+15% Spell Damage, +10% Mana Regeneration', tier: 1, effects: { spellDmgPct: 0.15, manaRegen: 1.5 } },
    t1_2: { id: 't1_2', name: 'Pyromaniac', description: 'Fireball now leaves a burning patch on the ground dealing 40% damage per second for 3s', tier: 1, effects: { fireballBurn: 1.0 } },
    t2_1: { id: 't2_1', name: 'Frost Barrier', description: 'Enemies attacking you are slowed by 30%. Gain +20 Armor', tier: 2, effects: { armor: 20, chillOnHit: 0.30 } },
    t2_2: { id: 't2_2', name: 'Shatting Impact', description: 'Critical strikes freeze enemies for 1s', tier: 2, effects: { critFreeze: 1.0 } },
    t3_1: { id: 't3_1', name: 'Arcane Surge', description: 'Every 5th spell cast is guaranteed to critical strike and cost no mana', tier: 3, effects: { arcaneSurge: 1.0 } },
    t3_2: { id: 't3_2', name: 'Amplification', description: '+20% Area of Effect and +10% Skill Cooldown Reduction', tier: 3, effects: { aoePct: 0.20, cdr: 0.10 } },
    t4_1: { id: 't4_1', name: 'Doublecast', description: 'All active skills cast twice consecutively', tier: 4, effects: { doubleCast: 1.0 } },
    t4_2: { id: 't4_2', name: 'Meteor Swarm', description: 'Periodically calls down meteors on random enemies dealing 80% damage', tier: 4, effects: { meteorProc: 1.0 } }
  },
  CLERIC: {
    t1_1: { id: 't1_1', name: 'Divine Touch', description: '+20% Healing Power, active spells also shield allies for 10% of healing done', tier: 1, effects: { healPowerPct: 0.20, healShield: 0.10 } },
    t1_2: { id: 't1_2', name: 'Wrath of the Heavens', description: 'Holy Nova deals 100% more damage, and heals for 20% less', tier: 1, effects: { holyNovaDmg: 1.0, holyNovaHeal: -0.20 } },
    t2_1: { id: 't2_1', name: 'Sanctuary Aura', description: 'Allies within range gain +15 HP regen and +10 Defense', tier: 2, effects: { groupRegen: 15, groupDef: 10 } },
    t2_2: { id: 't2_2', name: 'Zealot', description: 'Gain 5% of healing power as bonus Attack Power', tier: 2, effects: { healToAtk: 0.05 } },
    t3_1: { id: 't3_1', name: 'Divine Grace', description: '+15% Move Speed and +15% Cooldown Reduction', tier: 3, effects: { moveSpeedPct: 0.15, cdr: 0.15 } },
    t3_2: { id: 't3_2', name: 'Resurrection Ward', description: 'When an ally dies, automatically revive them with 40% health (180s cooldown)', tier: 3, effects: { autoRevive: 1.0 } },
    t4_1: { id: 't4_1', name: 'Avatar of Light', description: 'Heals are doubled, and attacks emit small light bolts targeting random enemies', tier: 4, effects: { doubleHeal: 1.0, lightBoltProc: 1.0 } },
    t4_2: { id: 't4_2', name: 'Judgement', description: 'Allies attacking target enemies healed by you deal 15% more damage', tier: 4, effects: { groupDmgBuff: 0.15 } }
  },
  ROGUE: {
    t1_1: { id: 't1_1', name: 'Assassinate', description: '+25% Critical Strike Multiplier, +5% Crit Chance', tier: 1, effects: { critMultPct: 0.25, critChance: 0.05 } },
    t1_2: { id: 't1_2', name: 'Toxify', description: 'Critical strikes poison enemies for 15% of weapon damage per second for 4s', tier: 1, effects: { poisonOnCrit: 0.15 } },
    t2_1: { id: 't2_1', name: 'Fleet Footed', description: '+15% Move Speed, +10% Dodge Chance', tier: 2, effects: { moveSpeedPct: 0.15, dodgeChance: 0.10 } },
    t2_2: { id: 't2_2', name: 'Opportunity', description: 'Blade Dance deals 30% more damage to enemies below 50% health', tier: 2, effects: { executeDmgPct: 0.30 } },
    t3_1: { id: 't3_1', name: 'Adrenaline Rush', description: 'Upon landing a critical strike, gain 20% Attack Speed for 3s', tier: 3, effects: { critAtkSpeedProc: 0.20 } },
    t3_2: { id: 't3_2', name: 'Shadow Cloak', description: 'Reduces threat. Periodically dodge all attacks for 2s (15s cooldown)', tier: 3, effects: { shadowCloak: 1.0 } },
    t4_1: { id: 't4_1', name: 'Executioner', description: 'Instantly kill non-boss targets below 15% HP. Bosses take double damage instead', tier: 4, effects: { executioner: 1.0 } },
    t4_2: { id: 't4_2', name: 'Blade Master', description: 'Dual-wielding attacks strike twice. Total attack speed increases by 25%', tier: 4, effects: { doubleStrikeChance: 0.30, atkSpeedPct: 0.25 } }
  },
  RANGER: {
    t1_1: { id: 't1_1', name: 'Eagle Eye', description: '+20% Attack Range, +10% Projectile Velocity', tier: 1, effects: { rangePct: 0.20, projectileVelocity: 0.10 } },
    t1_2: { id: 't1_2', name: 'Split Shot', description: 'Basic attacks now fire an additional arrow targeting a secondary enemy for 40% damage', tier: 1, effects: { splitShot: 0.40 } },
    t2_1: { id: 't2_1', name: 'Point Blank', description: 'Deal up to 25% more damage to targets close to you', tier: 2, effects: { pointBlankDmg: 0.25 } },
    t2_2: { id: 't2_2', name: 'Numbing Traps', description: 'Explosive Trap roots enemies for 1.5s instead of slowing them', tier: 2, effects: { trapRoot: 1.0 } },
    t3_1: { id: 't3_1', name: 'Swift Feather', description: 'Gain 25% Movement Speed while no enemies are within close range', tier: 3, effects: { distanceSpeedPct: 0.25 } },
    t3_2: { id: 't3_2', name: 'Piercing Shots', description: 'All arrow attacks pierce targets, striking enemies behind them for 50% damage', tier: 3, effects: { piercePct: 0.50 } },
    t4_1: { id: 't4_1', name: 'Barrage', description: 'Arrow Rain fires twice as many arrows and has a 30% reduced cooldown', tier: 4, effects: { barrageRain: 1.0, arrowRainCdr: 0.30 } },
    t4_2: { id: 't4_2', name: 'Sniper Focus', description: 'Every 3 seconds of standing still increases next attack damage by 50% (stacks up to 3 times)', tier: 4, effects: { sniperFocus: 1.0 } }
  }
};

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  x: number; // rendering coordinate (0-1000 scale)
  y: number; // rendering coordinate (0-1000 scale)
  stats: Record<string, number>; // e.g. { maxHp: 10, critChance: 0.01 }
  connections: string[]; // Connected Node IDs
  type: 'life' | 'atk' | 'crit' | 'speed' | 'def' | 'start';
}

// We'll generate a circular node map.
// Radial concentric design:
// 1 Center Node (Start) at (500, 500)
// Ring 1 (radius 120): 6 nodes (angle offset)
// Ring 2 (radius 240): 12 nodes
// Ring 3 (radius 380): 18 nodes
// Total = 1 + 6 + 12 + 18 = 37 nodes.
export const PASSIVE_SKILL_TREE: Record<string, SkillNode> = {};

// Helper to fill the tree programmatically so we don't write 37 huge blocks manually,
// but still maintain a deterministic structure.
const buildPassiveTree = () => {
  // Start node
  PASSIVE_SKILL_TREE['start'] = {
    id: 'start',
    name: 'Character Origin',
    description: 'The beginning of your path. Grants +10 Max HP and +2 Attack Power.',
    x: 500,
    y: 500,
    stats: { maxHp: 10, attackPower: 2 },
    connections: [],
    type: 'start'
  };

  const types: Array<'life' | 'atk' | 'crit' | 'speed' | 'def'> = ['life', 'atk', 'crit', 'speed', 'def'];
  const labels = {
    life: { name: 'Vigor', desc: 'Max HP', val: 12 },
    atk: { name: 'Might', desc: 'Attack Power', val: 1.5 },
    crit: { name: 'Precision', desc: 'Crit Chance', val: 0.015 },
    speed: { name: 'Celerity', desc: 'Attack Speed', val: 0.02 },
    def: { name: 'Bulwark', desc: 'Defense', val: 1.2 }
  };

  // Ring 1: Radius 120, 6 nodes
  const ring1Ids: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3; // 60 degrees each
    const id = `r1_${i}`;
    ring1Ids.push(id);
    const type = types[i % types.length];
    const item = labels[type];
    const statKey = type === 'life' ? 'maxHp' : (type === 'atk' ? 'attackPower' : (type === 'crit' ? 'critChance' : (type === 'speed' ? 'atkSpeedPct' : 'defense')));

    PASSIVE_SKILL_TREE[id] = {
      id,
      name: `${item.name} Tier 1`,
      description: `+${item.val}${type === 'speed' || type === 'crit' ? '%' : ''} ${item.desc}`,
      x: Math.round(500 + 130 * Math.cos(angle)),
      y: Math.round(500 + 130 * Math.sin(angle)),
      stats: { [statKey]: item.val },
      connections: ['start'],
      type
    };
    PASSIVE_SKILL_TREE['start'].connections.push(id);
  }

  // Interconnect Ring 1
  for (let i = 0; i < 6; i++) {
    const nextIdx = (i + 1) % 6;
    PASSIVE_SKILL_TREE[`r1_${i}`].connections.push(`r1_${nextIdx}`);
    PASSIVE_SKILL_TREE[`r1_${nextIdx}`].connections.push(`r1_${i}`);
  }

  // Ring 2: Radius 250, 12 nodes
  const ring2Ids: string[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6; // 30 degrees each
    const id = `r2_${i}`;
    ring2Ids.push(id);
    const type = types[(i + 1) % types.length];
    const item = labels[type];
    const statKey = type === 'life' ? 'maxHp' : (type === 'atk' ? 'attackPower' : (type === 'crit' ? 'critChance' : (type === 'speed' ? 'atkSpeedPct' : 'defense')));

    // Increase values on ring 2
    const scalar = 1.5;
    const value = Math.round(item.val * scalar * 10) / 10;

    // Nearest ring 1 node to connect to
    const nearestR1Idx = Math.floor(i / 2) % 6;
    const parentId = `r1_${nearestR1Idx}`;

    PASSIVE_SKILL_TREE[id] = {
      id,
      name: `${item.name} Tier 2`,
      description: `+${value}${type === 'speed' || type === 'crit' ? '%' : ''} ${item.desc}`,
      x: Math.round(500 + 260 * Math.cos(angle)),
      y: Math.round(500 + 260 * Math.sin(angle)),
      stats: { [statKey]: value },
      connections: [parentId],
      type
    };
    PASSIVE_SKILL_TREE[parentId].connections.push(id);
  }

  // Interconnect Ring 2
  for (let i = 0; i < 12; i++) {
    const nextIdx = (i + 1) % 12;
    PASSIVE_SKILL_TREE[`r2_${i}`].connections.push(`r2_${nextIdx}`);
    PASSIVE_SKILL_TREE[`r2_${nextIdx}`].connections.push(`r2_${i}`);
  }

  // Ring 3: Radius 380, 18 nodes (Major / Notable nodes at outer rim)
  for (let i = 0; i < 18; i++) {
    const angle = (i * Math.PI) / 9; // 20 degrees each
    const id = `r3_${i}`;
    const type = types[(i + 2) % types.length];
    const item = labels[type];
    const statKey = type === 'life' ? 'maxHp' : (type === 'atk' ? 'attackPower' : (type === 'crit' ? 'critChance' : (type === 'speed' ? 'atkSpeedPct' : 'defense')));

    // High stats for outer notable nodes
    const scalar = 3.0;
    const value = Math.round(item.val * scalar * 10) / 10;

    // Connect to nearest ring 2 node
    const nearestR2Idx = Math.floor((i * 12) / 18) % 12;
    const parentId = `r2_${nearestR2Idx}`;

    PASSIVE_SKILL_TREE[id] = {
      id,
      name: `Grand ${item.name} Node`,
      description: `+${value}${type === 'speed' || type === 'crit' ? '%' : ''} ${item.desc} (Notable)`,
      x: Math.round(500 + 390 * Math.cos(angle)),
      y: Math.round(500 + 390 * Math.sin(angle)),
      stats: { [statKey]: value },
      connections: [parentId],
      type
    };
    PASSIVE_SKILL_TREE[parentId].connections.push(id);
  }

  // Interconnect Ring 3 in groups
  for (let i = 0; i < 18; i++) {
    const nextIdx = (i + 1) % 18;
    PASSIVE_SKILL_TREE[`r3_${i}`].connections.push(`r3_${nextIdx}`);
    PASSIVE_SKILL_TREE[`r3_${nextIdx}`].connections.push(`r3_${i}`);
  }
};

buildPassiveTree();

// Helper to check if a set of nodes form a valid path from the start node
export const validatePassiveAllocation = (allocatedNodes: string[]): boolean => {
  if (allocatedNodes.length === 0) return true;
  if (!allocatedNodes.includes('start')) return false;

  // Perform BFS from start to see if all allocated nodes are reachable
  const visited = new Set<string>();
  const queue = ['start'];
  visited.add('start');

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const node = PASSIVE_SKILL_TREE[curr];
    if (!node) continue;

    for (const neighbor of node.connections) {
      if (allocatedNodes.includes(neighbor) && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // If visited size equals allocated length, the tree path is valid and contiguous
  return visited.size === allocatedNodes.length;
};
