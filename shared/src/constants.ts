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
  tier: number; // 1: level 5, 2: level 10, etc.
  effects: Record<string, number>;
}

export const TALENTS: Record<string, Record<string, TalentConfig>> = {
  WARRIOR: {
    t1_1: { id: 't1_1', name: 'Shield Rush', description: 'Shield Bash cooldown reduced by 1.5 seconds', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Impact Bash', description: 'Shield Bash stun duration increased by 0.5s', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Heavy Impact', description: 'Shield Bash deals +30% damage', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Sundering Slam', description: 'Shield Bash reduces target defense by 10 for 5s', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Shield Barrier', description: 'Shield Bash grants a temporary barrier (+15% Max HP) for 3s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Stun Blast', description: 'Shield Bash deals damage in a small 60px AoE around the target', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Echoing Shock', description: 'Shield Bash triggers a second shockwave for 50% damage after 0.5s', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Aegis Shield', description: 'Shield Bash increases reflect by 15% for 4s after casting', tier: 4, effects: { reflect: 0.15 } },
    t5_1: { id: 't5_1', name: 'Revenge Bash', description: 'Shield Bash deals +50% damage if Warrior is below 50% HP', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Stunning Counter', description: 'Shield Bash stun increased by 1.0s, but cooldown increased by 2.0s', tier: 5, effects: {} },
    t6_1: { id: 't6_1', name: 'Vampiric Bash', description: 'Shield Bash heals you for 50% of damage dealt', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Iron Wall', description: 'Shield Bash cooldown reduced by 2.0s', tier: 6, effects: {} },
    t7_1: { id: 't7_1', name: 'Sonic Shock', description: 'Shield Bash stuns adjacent enemies within 80px range for 0.8s', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Perfect Guard', description: 'Shield Bash grants 20% damage reduction for 3s after casting', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Tremor', description: 'Shield Bash deals +60% damage', tier: 8, effects: {} },
    t8_2: { id: 't8_2', name: 'Iron Fortress', description: 'Shield Bash increases reflect by 25% for 4s after casting', tier: 8, effects: { reflect: 0.25 } },
    t9_1: { id: 't9_1', name: 'Crystalline Bash', description: 'Shield Bash has a 30% chance to reset its own cooldown on hit', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Staggering Blow', description: 'Shield Bash increases target damage taken by 20% for 4s', tier: 9, effects: {} },
    t10_1: { id: 't10_1', name: 'God King Aegis', description: 'Shield Bash cooldown reduced by 3.0s and stun duration increased by 0.5s', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Cataclysm Bash', description: 'Shield Bash deals +150% damage and triggers screen shake', tier: 10, effects: {} }
  },
  MAGE: {
    t1_1: { id: 't1_1', name: 'Quick Cast', description: 'Fireball cooldown reduced by 1.0s', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Intense Heat', description: 'Fireball blast range increased by 20px', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Blazing Blast', description: 'Fireball deals +25% damage', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Ignite', description: 'Fireball burns targets for 15% attack power per second for 3s', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Blast Wave', description: 'Fireball stuns hit targets for 0.8s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Conflagration', description: 'Fireball blast range increased by 45px', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Double Spark', description: 'Fireball has a 25% chance to cast twice consecutively', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Meltdown', description: 'Fireball ignores 30% of target defense', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Pyroclast', description: 'Fireball deals +40% damage', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Cauterize', description: 'Fireball heals you for 25% of damage dealt to primary target', tier: 5, effects: {} },
    t6_1: { id: 't6_1', name: 'Flicker', description: 'Fireball cooldown reduced by 1.5s', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Supernova', description: 'Fireball splash damage to adjacent enemies increased to 90%', tier: 6, effects: {} },
    t7_1: { id: 't7_1', name: 'Living Bomb', description: 'Enemies hit by Fireball explode for 40% damage after 1.5s', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Freeze Fire', description: 'Fireball slows hit enemies by 50% for 3s', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Volcanic Burst', description: 'Fireball blast range increased by 50px and deals +30% damage', tier: 8, effects: {} },
    t8_2: { id: 't8_2', name: 'Flame Shield', description: 'Casting Fireball grants +20% defense for 3s after casting', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Amplified Singularity', description: 'Fireball critical strike chance inside area increased by 25%', tier: 9, effects: { critChance: 0.05 } },
    t9_2: { id: 't9_2', name: 'Meteor Shower', description: 'Fireball splits into 2 fireballs targeting adjacent enemies', tier: 9, effects: {} },
    t10_1: { id: 't10_1', name: 'Armageddon', description: 'Fireball deals +80% damage and leaves a burning patch for 4s', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Chronoshift', description: 'Fireball cooldown reduced by 2.5s', tier: 10, effects: {} }
  },
  CLERIC: {
    t1_1: { id: 't1_1', name: 'Quick Prayers', description: 'Holy Nova cooldown reduced by 1.5s', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Extended Radiance', description: 'Holy Nova healing and damage range increased by 30px', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Soothing Light', description: 'Holy Nova healing increased by 25%', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Smite Nova', description: 'Holy Nova damage increased by 40%', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Grace Shield', description: 'Holy Nova shields healed allies for 15% of max HP for 3s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Blinding Nova', description: 'Holy Nova stuns hit enemies for 0.8s', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Purity', description: 'Holy Nova reduces damage taken by allies by 10% for 3s', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Judgement Light', description: 'Holy Nova damage +50%, but healing is reduced by 20%', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Divine Intervention', description: 'Holy Nova cooldown reduced by 2.0s', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Sanctuary', description: 'Holy Nova healing +40%, but damage is reduced by 20%', tier: 5, effects: {} },
    t6_1: { id: 't6_1', name: 'Resplendent Nova', description: 'Holy Nova has a 20% chance to double cast', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Vampiric Glow', description: 'Holy Nova grants you 10% lifesteal for 4s', tier: 6, effects: { lifesteal: 0.10 } },
    t7_1: { id: 't7_1', name: 'Purifying Fire', description: 'Holy Nova burns enemies for 10% healing value per second for 3s', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Devotion Aura', description: 'Holy Nova increases allies defense by 15% for 4s', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Archangel Light', description: 'Holy Nova healing and damage increased by 30%', tier: 8, effects: {} },
    t8_2: { id: 't8_2', name: 'Light Speed', description: 'Holy Nova increases allies movement speed by 25% for 3s', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Salvation', description: 'Holy Nova automatically triggers when an ally falls below 20% HP', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Absolute Smite', description: 'Holy Nova ignores enemy defenses', tier: 9, effects: {} },
    t10_1: { id: 't10_1', name: 'Seraphim Ascendancy', description: 'Holy Nova healing and damage both +50%, cooldown -1s', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Eternity Light', description: 'Holy Nova cooldown reduced by 3.0s', tier: 10, effects: {} }
  },
  ROGUE: {
    t1_1: { id: 't1_1', name: 'Swift Cuts', description: 'Blade Dance strikes 6 times instead of 5', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Poison Blades', description: 'Blade Dance strikes apply a poison that deals 10 damage/s for 4s', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Fatal Strikes', description: 'Blade Dance strike damage increased by 20%', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Agile Step', description: 'Blade Dance cooldown reduced by 1.5s', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Lifesteal Cuts', description: 'Blade Dance strikes have +15% lifesteal', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Wind Dance', description: 'Blade Dance increases your attack speed by 20% for 3s', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Shadow Strike', description: 'Blade Dance hits have +15% critical strike chance', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Staggering Cut', description: 'Blade Dance strikes stun targets for 0.2s each', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Thousand Blades', description: 'Blade Dance strikes 7 times instead of 5, but deals 15% less damage per strike', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Assassinate', description: 'Blade Dance deals +40% damage to targets below 50% HP', tier: 5, effects: {} },
    t6_1: { id: 't6_1', name: 'Fleeing Step', description: 'Blade Dance cooldown reduced by 2.0s', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Dodge Step', description: 'Blade Dance grants +30% dodge/reflect chance for 2s', tier: 6, effects: {} },
    t7_1: { id: 't7_1', name: 'Heavy Blades', description: 'Blade Dance strike damage increased by 35%', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Debilitate', description: 'Blade Dance reduces target attack speed by 25% for 4s', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Cunning Slice', description: 'Blade Dance has a 25% chance to reset its cooldown on kill', tier: 8, effects: {} },
    t8_2: { id: 't8_2', name: 'Serrated Edge', description: 'Blade Dance strikes cause target to bleed for 25% of damage over 3s', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Blade Mastery', description: 'Blade Dance strikes have +40% crit multiplier', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Phantom Dance', description: 'You are completely immune to damage during Blade Dance', tier: 9, effects: {} },
    t10_1: { id: 't10_1', name: 'Death Blossom', description: 'Blade Dance strikes 8 times instead of 5', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Slayer Step', description: 'Blade Dance cooldown reduced by 3.0s and deals +20% damage', tier: 10, effects: {} }
  },
  RANGER: {
    t1_1: { id: 't1_1', name: 'Heavy Volley', description: 'Arrow Rain slow effect increased from 30% to 50%', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Long Draw', description: 'Arrow Rain cooldown reduced by 1.5s', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Barbed Arrows', description: 'Arrow Rain damage increased by 25%', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Wide Volley', description: 'Arrow Rain area radius increased by 30px', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Pinning Volley', description: 'Arrow Rain has a 20% chance to stun hit enemies for 1s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Hunter Pace', description: 'Arrow Rain increases your movement speed by 20% for 3s', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Poison Tips', description: 'Arrow Rain poisons hit enemies for 12 damage/s for 3s', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Piercing Volley', description: 'Arrow Rain ignores 25% of target defense', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Fletching Focus', description: 'Arrow Rain cooldown reduced by 2.0s', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Sharp Shrapnel', description: 'Arrow Rain damage increased by 40%', tier: 5, effects: {} },
    t6_1: { id: 't6_1', name: 'Sentry Storm', description: 'Arrow Rain deals +15% damage and slow duration increased to 5s', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Crippling Rain', description: 'Arrow Rain reduces hit enemies attack speed by 20% for 3s', tier: 6, effects: {} },
    t7_1: { id: 't7_1', name: 'Eagle Focus', description: 'Arrow Rain critical strike chance inside area increased by 15%', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Rapid Fire', description: 'Arrow Rain increases basic attack speed by 25% for 3s', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Thunder Volley', description: 'Arrow Rain stuns all targets inside for 0.8s on initial hit', tier: 8, effects: {} },
    t8_2: { id: 't8_2', name: 'Storm Bow', description: 'Arrow Rain damage increased by 50%', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Wind Tunnel', description: 'Arrow Rain cooldown reduced by 3.0s', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Caltrop Rain', description: 'Arrow Rain area leaves caltrops that deal 10 reflect damage to enemies who step inside', tier: 9, effects: {} },
    t10_1: { id: 't10_1', name: 'God bow Storm', description: 'Arrow Rain deals +80% damage and stuns for 0.5s', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Time dilation', description: 'Arrow Rain cooldown reduced by 4.0s', tier: 10, effects: {} }
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

  const types: Array<'life' | 'atk' | 'crit' | 'speed' | 'def'> = ['atk', 'def', 'life', 'speed', 'crit'];
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
      const isKeystone = config.r === 10 && [0, 5, 10, 16, 21, 26, 32, 37, 42, 48, 53, 58, 64, 69, 74].includes(i);

      if (isKeystone) {
        let name = '';
        let desc = '';
        let type: 'life' | 'atk' | 'crit' | 'speed' | 'def' = 'atk';
        
        switch (i) {
          case 0:
            name = 'Keystone: Glass Cannon';
            desc = 'Allocates Glass Cannon: +50% Attack Power, -30% Maximum HP';
            type = 'atk';
            break;
          case 5:
            name = 'Keystone: Resolute Technique';
            desc = 'Allocates Resolute Technique: +30% Attack Power, 0% Crit Chance';
            type = 'atk';
            break;
          case 10:
            name = 'Keystone: Elemental Overload';
            desc = 'Allocates Elemental Overload: +20% Attack Power, Crit Multiplier is 1.0';
            type = 'atk';
            break;
          case 16:
            name = 'Keystone: Iron Fortress';
            desc = 'Allocates Iron Fortress: Reflect 30% damage, -15% Move Speed';
            type = 'def';
            break;
          case 21:
            name = 'Keystone: Unwavering Stance';
            desc = 'Allocates Unwavering Stance: +50% Defense, -10% Move Speed';
            type = 'def';
            break;
          case 26:
            name = 'Keystone: Juggernaut Bulwark';
            desc = 'Allocates Juggernaut Bulwark: Double Defense Armor, 0% Crit Chance';
            type = 'def';
            break;
          case 32:
            name = 'Keystone: Vampiric Zeal';
            desc = 'Allocates Vampiric Zeal: Gain 15% Lifesteal, 0% Crit Chance';
            type = 'life';
            break;
          case 37:
            name = 'Keystone: Ghost Reaver';
            desc = 'Allocates Ghost Reaver: Double Lifesteal, -25% Max HP';
            type = 'life';
            break;
          case 42:
            name = 'Keystone: Blood Magic';
            desc = 'Allocates Blood Magic: +25% Max HP, 0% Cooldown Reduction';
            type = 'life';
            break;
          case 48:
            name = 'Keystone: Alchemist Aura';
            desc = 'Allocates Alchemist Aura: Double CDR, -20% Attack Power';
            type = 'speed';
            break;
          case 53:
            name = 'Keystone: Conduit';
            desc = 'Allocates Conduit: +30% Cooldown Reduction, -15% Attack Power';
            type = 'speed';
            break;
          case 58:
            name = 'Keystone: Swift Reflexes';
            desc = 'Allocates Swift Reflexes: +20% Attack Speed, -30% Defense';
            type = 'speed';
            break;
          case 64:
            name = 'Keystone: Eagle Eye';
            desc = 'Allocates Eagle Eye: +15% Crit Chance, -20% Max HP';
            type = 'crit';
            break;
          case 69:
            name = 'Keystone: Assassin Pact';
            desc = 'Allocates Assassin Pact: +40% Crit Multiplier, -25% Defense';
            type = 'crit';
            break;
          case 74:
            name = 'Keystone: Perfect Agility';
            desc = 'Allocates Perfect Agility: +20% Crit Chance, 0% Cooldown Reduction';
            type = 'crit';
            break;
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
        const sector = Math.floor((i / config.count) * 5) % 5;
        const type = types[sector];
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

    if (config.r === 1 || config.r === 3 || config.r === 6) {
      for (let i = 0; i < config.count; i++) {
        const currentId = ids[i];
        const nextId = ids[(i + 1) % config.count];
        PASSIVE_SKILL_TREE[currentId].connections.push(nextId);
        PASSIVE_SKILL_TREE[nextId].connections.push(currentId);
      }
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

export interface ArenaConfig {
  name: string;
  level: number;
  theme: 'FOREST' | 'POISON_CAVES' | 'RUINS' | 'CRYPT' | 'VOLCANO';
  enemySprite: 'GOBLIN' | 'SNAKE' | 'ORC' | 'LICH' | 'DRAGON';
  enemyNames: string[];
  desc: string;
  bgColor: string;
  detailColor: string;
}

export const ARENA_CONFIGS: Record<number, ArenaConfig> = {
  1: { name: 'Forest of Trials', level: 1, theme: 'FOREST', enemySprite: 'GOBLIN', enemyNames: ['Goblin Scout', 'Goblin Thief'], desc: 'A dense wood where goblins roam. Ideal for starters.', bgColor: '#08170e', detailColor: '#0f2919' },
  5: { name: 'Echoing Groves', level: 5, theme: 'FOREST', enemySprite: 'GOBLIN', enemyNames: ['Goblin Raider', 'Goblin Archer'], desc: 'Deeper into the forest, goblin scouts set traps.', bgColor: '#06130b', detailColor: '#0a1d11' },
  10: { name: 'Serpent Caves', level: 10, theme: 'POISON_CAVES', enemySprite: 'SNAKE', enemyNames: ['Young Adder', 'Green Snake'], desc: 'Damp caverns containing slithering neon adders.', bgColor: '#0b0512', detailColor: '#8a2be2' },
  15: { name: 'Neon Caves', level: 15, theme: 'POISON_CAVES', enemySprite: 'SNAKE', enemyNames: ['Spitting Adder', 'Slither Viper'], desc: 'Glowing crystal tunnels with swift venomous snakes.', bgColor: '#050a14', detailColor: '#00ffff' },
  20: { name: 'Whispering Woods', level: 20, theme: 'FOREST', enemySprite: 'GOBLIN', enemyNames: ['Feral Goblin', 'Forest Goblin'], desc: 'Haunted woodlands where rogue goblins hide.', bgColor: '#03080c', detailColor: '#0b1d28' },
  25: { name: 'Orc Campsite', level: 25, theme: 'RUINS', enemySprite: 'ORC', enemyNames: ['Orc Vanguard', 'Orc Scout'], desc: 'A temporary camp set up by vanguard orc grunts.', bgColor: '#141210', detailColor: '#201c18' },
  30: { name: 'Skeletal Catacombs', level: 30, theme: 'CRYPT', enemySprite: 'LICH', enemyNames: ['Skeletal Grunt', 'Rattled Skeleton'], desc: 'Underground catacombs guarded by skeletal warriors.', bgColor: '#07080b', detailColor: '#1e3a8a' },
  35: { name: 'Obsidian Ruins', level: 35, theme: 'RUINS', enemySprite: 'ORC', enemyNames: ['Orc Grunt', 'Orc Raider'], desc: 'Cursed obsidian pillars and heavy orc raiders.', bgColor: '#110b08', detailColor: '#281a13' },
  40: { name: 'Poison Gardens', level: 40, theme: 'POISON_CAVES', enemySprite: 'SNAKE', enemyNames: ['Poisonous Cobra', 'Giant Mamba'], desc: 'Overgrown ruins rich with toxic fumes and slithering vipers.', bgColor: '#0d1a0d', detailColor: '#10b981' },
  45: { name: 'Orc Stronghold', level: 45, theme: 'RUINS', enemySprite: 'ORC', enemyNames: ['Orc Berserker', 'Orc Gladiator'], desc: 'A heavily fortified encampment of orc berserkers.', bgColor: '#1a1510', detailColor: '#302820' },
  50: { name: 'Catacombs of Doom', level: 50, theme: 'CRYPT', enemySprite: 'LICH', enemyNames: ['Skeletal Guard', 'Crypt Wight'], desc: 'Deep chambers where ancient skeleton acolytes practice necromancy.', bgColor: '#030712', detailColor: '#3b82f6' },
  55: { name: 'Lich Crypt', level: 55, theme: 'CRYPT', enemySprite: 'LICH', enemyNames: ['Lich Acolyte', 'Ancient Mummy'], desc: 'A dark, cold maze guarded by ancient skeleton acolyths.', bgColor: '#0f172a', detailColor: '#6366f1' },
  60: { name: 'Ancient Fortress', level: 60, theme: 'RUINS', enemySprite: 'ORC', enemyNames: ['Orc Commander', 'Orc Warlord'], desc: 'The historic keep of the orc kings, filled with elite warriors.', bgColor: '#1c1917', detailColor: '#44403c' },
  65: { name: 'Shadow Crypt', level: 65, theme: 'CRYPT', enemySprite: 'LICH', enemyNames: ['Skeletal Lich', 'Wraith Priest'], desc: 'A void-touched tomb filled with skeleton liches.', bgColor: '#180018', detailColor: '#4b0082' },
  70: { name: 'Dragon Ridge', level: 70, theme: 'VOLCANO', enemySprite: 'DRAGON', enemyNames: ['Volcano Hatchling', 'Wyvern'], desc: 'Rocky volcanic cliffs populated by small fire drakes.', bgColor: '#1c0a00', detailColor: '#d97706' },
  75: { name: 'Volcanic Caldera', level: 75, theme: 'VOLCANO', enemySprite: 'DRAGON', enemyNames: ['Young Drake', 'Volcano Dragon'], desc: 'Lava flows, magma giants, and legendary fire dragons.', bgColor: '#0f0500', detailColor: '#ef4444' },
  80: { name: 'Frozen Tombs', level: 80, theme: 'CRYPT', enemySprite: 'LICH', enemyNames: ['Frost Skeleton', 'Lich Overlord'], desc: 'Icy crypts holding preserved ancient skeletal commanders.', bgColor: '#0f172a', detailColor: '#38bdf8' },
  85: { name: 'Magma Chamber', level: 85, theme: 'VOLCANO', enemySprite: 'DRAGON', enemyNames: ['Infernal Drake', 'Magma Dragon'], desc: 'Subterranean lava chambers guarded by high-rank lava dragons.', bgColor: '#0c0200', detailColor: '#f97316' },
  90: { name: 'Abyssal Maw', level: 90, theme: 'VOLCANO', enemySprite: 'DRAGON', enemyNames: ['Void Drake', 'Abyssal Dragon'], desc: 'The final frontier. Face the strongest challenges here.', bgColor: '#000000', detailColor: '#8b5cf6' },
  95: { name: 'Dragon Throne', level: 95, theme: 'VOLCANO', enemySprite: 'DRAGON', enemyNames: ['Ancient Sovereign', 'Lava Dragon King'], desc: 'The apex of the volcano. Defeat the ancient dragon sovereign.', bgColor: '#000000', detailColor: '#b91c1c' }
};
