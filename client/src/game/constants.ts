export interface ClassConfig {
  name: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseCritChance: number;
  baseCritMult: number;
  baseAtkSpeed: number;
  baseMoveSpeed: number;
  baseHealPower: number;
  color: string;
  activeSkill: {
    name: string;
    cooldown: number;
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
    color: '#ff3b30',
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
    color: '#007aff',
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
    color: '#ffcc00',
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
    baseCritMult: 2.0,
    baseAtkSpeed: 1.3,
    baseMoveSpeed: 120,
    baseHealPower: 0,
    color: '#af52de',
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
    color: '#34c759',
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
  tier: number;
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

const buildTalents = () => {
  const classes = ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'];
  for (const cls of classes) {
    if (!TALENTS[cls]) {
      TALENTS[cls] = {};
    }
    for (let tier = 5; tier <= 20; tier++) {
      const isOdd = tier % 2 !== 0;

      if (isOdd) {
        // Odd: Offensive
        const atkVal = 0.05 + (tier - 5) * 0.015;
        TALENTS[cls][`t${tier}_1`] = {
          id: `t${tier}_1`,
          name: `Heroic Might Tier ${tier}`,
          description: `+${Math.round(atkVal * 100)}% Attack Power`,
          tier,
          effects: { atkMultPct: atkVal }
        };

        if (cls === 'ROGUE' || cls === 'RANGER') {
          const critVal = 0.02 + (tier - 5) * 0.005;
          TALENTS[cls][`t${tier}_2`] = {
            id: `t${tier}_2`,
            name: `Deadly Precision Tier ${tier}`,
            description: `+${Math.round(critVal * 100)}% Crit Chance`,
            tier,
            effects: { critChance: critVal }
          };
        } else {
          const speedVal = 0.04 + (tier - 5) * 0.01;
          TALENTS[cls][`t${tier}_2`] = {
            id: `t${tier}_2`,
            name: `Swift Strikes Tier ${tier}`,
            description: `+${Math.round(speedVal * 100)}% Attack Speed`,
            tier,
            effects: { atkSpeedPct: speedVal }
          };
        }
      } else {
        // Even: Defensive/Utility
        const hpVal = 0.06 + (tier - 5) * 0.015;
        TALENTS[cls][`t${tier}_1`] = {
          id: `t${tier}_1`,
          name: `Colossus Core Tier ${tier}`,
          description: `+${Math.round(hpVal * 100)}% Max HP`,
          tier,
          effects: { maxHpPct: hpVal }
        };

        if (cls === 'CLERIC') {
          const cdrVal = 0.03 + (tier - 5) * 0.008;
          TALENTS[cls][`t${tier}_2`] = {
            id: `t${tier}_2`,
            name: `Divine Focus Tier ${tier}`,
            description: `+${Math.round(cdrVal * 100)}% Cooldown Reduction`,
            tier,
            effects: { cdr: cdrVal }
          };
        } else if (cls === 'WARRIOR') {
          const defVal = 0.05 + (tier - 5) * 0.015;
          TALENTS[cls][`t${tier}_2`] = {
            id: `t${tier}_2`,
            name: `Indomitable Aegis Tier ${tier}`,
            description: `+${Math.round(defVal * 100)}% Defense Armor`,
            tier,
            effects: { defensePct: defVal }
          };
        } else {
          const lifeVal = 0.02 + (tier - 5) * 0.005;
          TALENTS[cls][`t${tier}_2`] = {
            id: `t${tier}_2`,
            name: `Vampiric Touch Tier ${tier}`,
            description: `+${Math.round(lifeVal * 100)}% Lifesteal`,
            tier,
            effects: { lifesteal: lifeVal }
          };
        }
      }
    }
  }
};
buildTalents();


export interface SkillNode {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  stats: Record<string, number>;
  connections: string[];
  type: 'life' | 'atk' | 'crit' | 'speed' | 'def' | 'start';
}

export const PASSIVE_SKILL_TREE: Record<string, SkillNode> = {};

const buildPassiveTree = () => {
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

  const ringConfigs = [
    { r: 1, radius: 80, count: 8, scalar: 1.0 },
    { r: 2, radius: 160, count: 16, scalar: 1.2 },
    { r: 3, radius: 240, count: 24, scalar: 1.5 },
    { r: 4, radius: 320, count: 32, scalar: 1.8 },
    { r: 5, radius: 400, count: 40, scalar: 3.0, isNotable: true },
    { r: 6, radius: 480, count: 48, scalar: 2.2 },
    { r: 7, radius: 560, count: 56, scalar: 2.5 },
    { r: 8, radius: 640, count: 64, scalar: 2.8 },
    { r: 9, radius: 720, count: 72, scalar: 4.0, isNotable: true },
    { r: 10, radius: 800, count: 80, scalar: 3.2 }
  ];

  const ringIds: Record<number, string[]> = { 0: ['start'] };

  for (const config of ringConfigs) {
    const ids: string[] = [];
    const parentIds = ringIds[config.r - 1];

    for (let i = 0; i < config.count; i++) {
      const id = `r${config.r}_${i}`;
      ids.push(id);

      const angle = (i * Math.PI * 2) / config.count;
      const isKeystone = config.r === 10 && (i % 16 === 0) && (i / 16 < 5);

      if (isKeystone) {
        let name = '';
        let desc = '';
        let type: 'life' | 'atk' | 'crit' | 'speed' | 'def' = 'atk';
        
        const keystoneIdx = i / 16;
        if (keystoneIdx === 0) {
          name = 'Keystone: Glass Cannon';
          desc = 'Allocates Glass Cannon: +50% Attack Power, -30% Maximum HP';
          type = 'atk';
        } else if (keystoneIdx === 1) {
          name = 'Keystone: Iron Fortress';
          desc = 'Allocates Iron Fortress: Reflect 30% damage, -20% Move Speed';
          type = 'def';
        } else if (keystoneIdx === 2) {
          name = 'Keystone: Vampiric Zeal';
          desc = 'Allocates Vampiric Zeal: Gain 15% Lifesteal, 0% Crit Chance';
          type = 'life';
        } else if (keystoneIdx === 3) {
          name = 'Keystone: Alchemist Aura';
          desc = 'Allocates Alchemist Aura: Double CDR (max 75%), -25% Attack Power';
          type = 'speed';
        } else {
          name = 'Keystone: Juggernaut Bulwark';
          desc = 'Allocates Juggernaut Bulwark: Double Defense Armor, 0% Crit Chance';
          type = 'def';
        }

        PASSIVE_SKILL_TREE[id] = {
          id,
          name,
          description: desc,
          x: Math.round(500 + config.radius * Math.cos(angle)),
          y: Math.round(500 + config.radius * Math.sin(angle)),
          stats: {},
          connections: [],
          type
        };
      } else {
        const type = types[(i + config.r) % types.length];
        const item = labels[type];
        const statKey = type === 'life' ? 'maxHp' : (type === 'atk' ? 'attackPower' : (type === 'crit' ? 'critChance' : (type === 'speed' ? 'atkSpeedPct' : 'defense')));

        let value = item.val * config.scalar;
        if (type === 'crit' || type === 'speed') {
          value = Math.round(value * 1000) / 1000;
        } else {
          value = Math.round(value * 10) / 10;
        }

        const tierName = config.isNotable ? 'Notable' : `Tier ${config.r}`;
        const suffix = config.isNotable ? ' (Notable)' : '';
        const displayVal = (type === 'crit' || type === 'speed') ? `${Math.round(value * 1000) / 10}%` : `${value}`;

        PASSIVE_SKILL_TREE[id] = {
          id,
          name: `${item.name} ${tierName}`,
          description: `+${displayVal} ${item.desc}${suffix}`,
          x: Math.round(500 + config.radius * Math.cos(angle)),
          y: Math.round(500 + config.radius * Math.sin(angle)),
          stats: { [statKey]: value },
          connections: [],
          type
        };
      }

      const parentIdx = Math.floor((i * parentIds.length) / config.count) % parentIds.length;
      const parentId = parentIds[parentIdx];
      
      PASSIVE_SKILL_TREE[id].connections.push(parentId);
      PASSIVE_SKILL_TREE[parentId].connections.push(id);
    }

    ringIds[config.r] = ids;

    for (let i = 0; i < config.count; i++) {
      const currentId = ids[i];
      const nextId = ids[(i + 1) % config.count];
      PASSIVE_SKILL_TREE[currentId].connections.push(nextId);
      PASSIVE_SKILL_TREE[nextId].connections.push(currentId);
    }
  }
};

buildPassiveTree();
export const validatePassiveAllocation = (allocatedNodes: string[]): boolean => {
  if (allocatedNodes.length === 0) return true;
  if (!allocatedNodes.includes('start')) return false;

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

  return visited.size === allocatedNodes.length;
};
