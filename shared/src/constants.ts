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
    baseAtk: 22,
    baseDef: 12,
    baseCritChance: 0.05,
    baseCritMult: 1.5,
    baseAtkSpeed: 0.95,
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
    baseAtk: 17,
    baseDef: 3,
    baseCritChance: 0.08,
    baseCritMult: 1.5,
    baseAtkSpeed: 0.75,
    baseMoveSpeed: 90,
    baseHealPower: 0,
    color: '#007aff', // neon blue
    activeSkill: {
      name: 'Fireball',
      cooldown: 5.5,
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
    baseAtk: 15,
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
  },
  VALKYRIE: {
    name: 'Valkyrie',
    baseHp: 200,
    baseAtk: 16,
    baseDef: 14,
    baseCritChance: 0.05,
    baseCritMult: 1.5,
    baseAtkSpeed: 1.0,
    baseMoveSpeed: 110,
    baseHealPower: 12,
    color: '#ff0055', // hot pink
    activeSkill: {
      name: 'Spear of Light',
      cooldown: 7,
      description: 'Deals 200% holy line damage and heals caster for 200% heal power'
    }
  },
  NECROMANCER: {
    name: 'Necromancer',
    baseHp: 120,
    baseAtk: 26,
    baseDef: 4,
    baseCritChance: 0.08,
    baseCritMult: 1.5,
    baseAtkSpeed: 0.8,
    baseMoveSpeed: 95,
    baseHealPower: 0,
    color: '#39ff14', // neon green
    activeSkill: {
      name: 'Raise Dead',
      cooldown: 6,
      description: 'Launches a dark magic shell dealing 220% AoE magic damage and summons a skeleton minion'
    }
  },
  MONK: {
    name: 'Monk',
    baseHp: 150,
    baseAtk: 20,
    baseDef: 10,
    baseCritChance: 0.10,
    baseCritMult: 1.6,
    baseAtkSpeed: 1.2,
    baseMoveSpeed: 115,
    baseHealPower: 0,
    color: '#ff6b00', // neon orange
    activeSkill: {
      name: 'Seven-Sided Strike',
      cooldown: 8,
      description: 'Delivers a rapid flurry of 7 strikes, each dealing 40% physical damage with a high stun chance'
    }
  },
  ALCHEMIST: {
    name: 'Alchemist',
    baseHp: 130,
    baseAtk: 19,
    baseDef: 6,
    baseCritChance: 0.08,
    baseCritMult: 1.5,
    baseAtkSpeed: 1.0,
    baseMoveSpeed: 110,
    baseHealPower: 0,
    color: '#adff2f', // yellow green
    activeSkill: {
      name: 'Acid Bomb',
      cooldown: 8,
      description: 'Throws a toxic flask dealing 180% poison damage and reducing enemy defense by 15 for 6s'
    }
  },
  BARD: {
    name: 'Bard',
    baseHp: 140,
    baseAtk: 16,
    baseDef: 8,
    baseCritChance: 0.06,
    baseCritMult: 1.5,
    baseAtkSpeed: 0.95,
    baseMoveSpeed: 110,
    baseHealPower: 15,
    color: '#ff007f', // electric pink
    activeSkill: {
      name: 'Dissonant Melody',
      cooldown: 8,
      description: 'Deals 150% sonic damage in an area and boosts all allies\' attack speed by 25% for 4s'
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
  },
  VALKYRIE: {
    t1_1: { id: 't1_1', name: 'Spear CDR', description: 'Spear of Light cooldown reduced by 1.0s', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Bright Light', description: 'Spear of Light range increased by 20px', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Heavy Pierce', description: 'Spear of Light deals +20% damage', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Holy Healing', description: 'Spear of Light healing power increased by 25%', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Shield of Light', description: 'Spear of Light grants +10% defense for 3s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Dazzling Beam', description: 'Spear of Light has a 30% chance to stun for 1s', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Spear Mastery', description: 'Spear of Light critical chance +10%', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Light Rush', description: 'Spear of Light cooldown reduced by 1.5s', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Blessed Armor', description: 'Gain +10% Max HP', tier: 5, effects: { maxHpPct: 0.10 } },
    t5_2: { id: 't5_2', name: 'Smiting Spear', description: 'Spear of Light damage +30%', tier: 5, effects: {} },
    t6_1: { id: 't6_1', name: 'Glow Spear', description: 'Spear of Light healing power +30%', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Speed of Light', description: 'Gain +10% attack speed', tier: 6, effects: { atkSpeedPct: 0.10 } },
    t7_1: { id: 't7_1', name: 'Radiant Piercer', description: 'Spear of Light ignores 20% defense', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Holy Nova Link', description: 'Spear of Light heals nearby allies for 50% value', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Archangel Might', description: 'Gain +15% Attack Power', tier: 8, effects: { atkMultPct: 0.15 } },
    t8_2: { id: 't8_2', name: 'Sunburst', description: 'Spear of Light stuns all hit targets for 1.2s', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Ascendant Light', description: 'Spear of Light cooldown reduced by 2.0s', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Reflective Shield', description: 'Gain +15% Reflect chance', tier: 9, effects: { reflect: 0.15 } },
    t10_1: { id: 't10_1', name: 'God King Spear', description: 'Spear of Light damage +50% and healing +50%', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Calamity Beam', description: 'Spear of Light cooldown reduced by 3s and stuns for 1.5s', tier: 10, effects: {} }
  },
  NECROMANCER: {
    t1_1: { id: 't1_1', name: 'Grim CDR', description: 'Raise Dead cooldown reduced by 1.0s', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Soul Feast', description: 'Gain +5% lifesteal', tier: 1, effects: { lifesteal: 0.05 } },
    t2_1: { id: 't2_1', name: 'Dark Shell', description: 'Raise Dead deals +20% damage', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Undead Shield', description: 'Minion hit grants you +5% shield', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Chilling Touch', description: 'Raise Dead slows targets by 30% for 2s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Bone Spikes', description: 'Raise Dead deals damage in larger area', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Quick Summon', description: 'Raise Dead cooldown reduced by 1.5s', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Vampiric Pact', description: 'Gain +10% lifesteal', tier: 4, effects: { lifesteal: 0.10 } },
    t5_1: { id: 't5_1', name: 'Dark Magic', description: 'Raise Dead damage +30%', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Soul Barrier', description: 'Gain +15% Max HP', tier: 5, effects: { maxHpPct: 0.15 } },
    t6_1: { id: 't6_1', name: 'Flicker Bolt', description: 'Raise Dead cooldown reduced by 2.0s', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Unholy Aura', description: 'Gain +10% attack speed', tier: 6, effects: { atkSpeedPct: 0.10 } },
    t7_1: { id: 't7_1', name: 'Rotting Curse', description: 'Raise Dead reduces target defense by 10 for 5s', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Death Chill', description: 'Raise Dead stuns targets for 0.8s', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Grim Might', description: 'Gain +15% Attack Power', tier: 8, effects: { atkMultPct: 0.15 } },
    t8_2: { id: 't8_2', name: 'Skeletal Horde', description: 'Summoned skeleton deals +50% damage', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Death Pact', description: 'Raise Dead has a 25% chance to reset cooldown on hit', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Soul Shield', description: 'Gain +20% Reflect chance', tier: 9, effects: { reflect: 0.20 } },
    t10_1: { id: 't10_1', name: 'Undead Army', description: 'Raise Dead damage +60% and summons 2 skeletons', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Eternal Lich', description: 'Raise Dead cooldown reduced by 3s and you heal for 30% of damage', tier: 10, effects: {} }
  },
  MONK: {
    t1_1: { id: 't1_1', name: 'Flurry CDR', description: 'Seven-Sided Strike cooldown reduced by 1.0s', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Fleet Footwork', description: 'Gain +5% movement speed', tier: 1, effects: { moveSpeedPct: 0.05 } },
    t2_1: { id: 't2_1', name: 'Heavy Fists', description: 'Seven-Sided Strike deals +20% damage', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Iron Palm', description: 'Seven-Sided Strike stun chance increased', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Spirit Shield', description: 'Seven-Sided Strike grants +10% defense for 3s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Cyclone Strike', description: 'Seven-Sided Strike deals damage to adjacent targets', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Fist Master', description: 'Seven-Sided Strike critical chance +12%', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Chakra Flow', description: 'Seven-Sided Strike cooldown reduced by 1.5s', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Tiger Might', description: 'Seven-Sided Strike damage +30%', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Spirit Vitality', description: 'Gain +12% Max HP', tier: 5, effects: { maxHpPct: 0.12 } },
    t6_1: { id: 't6_1', name: 'Flurry Flow', description: 'Seven-Sided Strike cooldown reduced by 2.0s', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Wind Stance', description: 'Gain +12% attack speed', tier: 6, effects: { atkSpeedPct: 0.12 } },
    t7_1: { id: 't7_1', name: 'Precision Strikes', description: 'Seven-Sided Strike ignores 25% defense', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Crippling Palms', description: 'Seven-Sided Strike slows targets by 40% for 3s', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Monk Focus', description: 'Gain +15% Attack Power', tier: 8, effects: { atkMultPct: 0.15 } },
    t8_2: { id: 't8_2', name: 'Dragon Flurry', description: 'Seven-Sided Strike strikes 8 times instead of 7', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Nirvana', description: 'Seven-Sided Strike has a 30% chance to reset cooldown on hit', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Divine Reflexes', description: 'Gain +15% Reflect chance', tier: 9, effects: { reflect: 0.15 } },
    t10_1: { id: 't10_1', name: 'Asura Strike', description: 'Seven-Sided Strike damage +60% and stuns for 1.5s', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Ascendant Soul', description: 'Seven-Sided Strike cooldown reduced by 3.5s', tier: 10, effects: {} }
  },
  ALCHEMIST: {
    t1_1: { id: 't1_1', name: 'Acid CDR', description: 'Acid Bomb cooldown reduced by 1.0s', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Catalyst', description: 'Acid Bomb radius increased by 20px', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Strong Acid', description: 'Acid Bomb deals +25% damage', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Sunder Acid', description: 'Acid Bomb sunder defense effect increased by 10', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Sticky Bomb', description: 'Acid Bomb slows targets by 30% for 3s', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Fume Chamber', description: 'Acid Bomb area is larger', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Unstable Brew', description: 'Acid Bomb has a 25% chance to trigger a double explosion', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Corrosive Agent', description: 'Acid Bomb ignores 30% of defense', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Heavy Flask', description: 'Acid Bomb damage +30%', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Iron Coat', description: 'Gain +12% Defense', tier: 5, effects: { defensePct: 0.12 } },
    t6_1: { id: 't6_1', name: 'Flicker Flask', description: 'Acid Bomb cooldown reduced by 1.5s', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Lifesteal Flask', description: 'Gain +10% lifesteal', tier: 6, effects: { lifesteal: 0.10 } },
    t7_1: { id: 't7_1', name: 'Melting Core', description: 'Acid Bomb reduces target defense by an additional 15', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Stunning Gas', description: 'Acid Bomb stuns hit targets for 0.8s', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Mutagen Might', description: 'Gain +15% Attack Power', tier: 8, effects: { atkMultPct: 0.15 } },
    t8_2: { id: 't8_2', name: 'Explosive Splinters', description: 'Acid Bomb damage +40%', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Alchemical Echo', description: 'Acid Bomb has 30% chance to reset cooldown on hit', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Fortified Blood', description: 'Gain +15% Max HP', tier: 9, effects: { maxHpPct: 0.15 } },
    t10_1: { id: 't10_1', name: 'Philosophers Stone', description: 'Acid Bomb damage +70% and cooldown -2s', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Toxic Catalyst', description: 'Acid Bomb cooldown reduced by 3.5s', tier: 10, effects: {} }
  },
  BARD: {
    t1_1: { id: 't1_1', name: 'Melody CDR', description: 'Dissonant Melody cooldown reduced by 1.0s', tier: 1, effects: {} },
    t1_2: { id: 't1_2', name: 'Loud Echo', description: 'Dissonant Melody range increased by 20px', tier: 1, effects: {} },
    t2_1: { id: 't2_1', name: 'Harmonic Boost', description: 'Dissonant Melody attack speed buff increased by 10%', tier: 2, effects: {} },
    t2_2: { id: 't2_2', name: 'Sharp Chord', description: 'Dissonant Melody deals +20% damage', tier: 2, effects: {} },
    t3_1: { id: 't3_1', name: 'Inspiring Song', description: 'Dissonant Melody heals allies for 150% of heal power', tier: 3, effects: {} },
    t3_2: { id: 't3_2', name: 'Stunning Chord', description: 'Dissonant Melody stuns hit targets for 0.8s', tier: 3, effects: {} },
    t4_1: { id: 't4_1', name: 'Tempo Master', description: 'Dissonant Melody attack speed buff duration increased by 2s', tier: 4, effects: {} },
    t4_2: { id: 't4_2', name: 'Lute Rush', description: 'Dissonant Melody cooldown reduced by 1.5s', tier: 4, effects: {} },
    t5_1: { id: 't5_1', name: 'Vocal Strength', description: 'Dissonant Melody damage +30%', tier: 5, effects: {} },
    t5_2: { id: 't5_2', name: 'Resonant Shield', description: 'Gain +12% Defense', tier: 5, effects: { defensePct: 0.12 } },
    t6_1: { id: 't6_1', name: 'Flicker Note', description: 'Dissonant Melody cooldown reduced by 2.0s', tier: 6, effects: {} },
    t6_2: { id: 't6_2', name: 'Symphonic Speed', description: 'Gain +10% attack speed', tier: 6, effects: { atkSpeedPct: 0.10 } },
    t7_1: { id: 't7_1', name: 'Crescendo', description: 'Dissonant Melody ignores 20% defense', tier: 7, effects: {} },
    t7_2: { id: 't7_2', name: 'Soothing Chords', description: 'Dissonant Melody heals allies for 200% of heal power', tier: 7, effects: {} },
    t8_1: { id: 't8_1', name: 'Poet Might', description: 'Gain +15% Attack Power', tier: 8, effects: { atkMultPct: 0.15 } },
    t8_2: { id: 't8_2', name: 'Shattering Sonic', description: 'Dissonant Melody damage +50%', tier: 8, effects: {} },
    t9_1: { id: 't9_1', name: 'Encore', description: 'Dissonant Melody has 30% chance to reset cooldown on hit', tier: 9, effects: {} },
    t9_2: { id: 't9_2', name: 'Inspiring Aura', description: 'Gain +15% Max HP', tier: 9, effects: { maxHpPct: 0.15 } },
    t10_1: { id: 't10_1', name: 'Grand Finale', description: 'Dissonant Melody damage +70%, buff speed +15%', tier: 10, effects: {} },
    t10_2: { id: 't10_2', name: 'Timeless Song', description: 'Dissonant Melody cooldown reduced by 3.5s', tier: 10, effects: {} }
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
  isNotable?: boolean;
  isKeystone?: boolean;
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

  const sectors: Array<'atk' | 'def' | 'life' | 'speed' | 'crit'> = ['atk', 'def', 'life', 'speed', 'crit'];
  const labels = {
    atk: { name: 'Might', desc: 'Attack Power', val: 1.5, key: 'attackPower' },
    def: { name: 'Bulwark', desc: 'Defense', val: 1.2, key: 'defense' },
    life: { name: 'Vigor', desc: 'Max HP', val: 12, key: 'maxHp' },
    speed: { name: 'Celerity', desc: 'Attack Speed', val: 0.02, key: 'atkSpeedPct' },
    crit: { name: 'Precision', desc: 'Crit Chance', val: 0.015, key: 'critChance' }
  };

  const connect = (id1: string, id2: string) => {
    if (PASSIVE_SKILL_TREE[id1] && PASSIVE_SKILL_TREE[id2]) {
      if (!PASSIVE_SKILL_TREE[id1].connections.includes(id2)) {
        PASSIVE_SKILL_TREE[id1].connections.push(id2);
      }
      if (!PASSIVE_SKILL_TREE[id2].connections.includes(id1)) {
        PASSIVE_SKILL_TREE[id2].connections.push(id1);
      }
    }
  };

  // Build each sector constellation
  for (let s = 0; s < 5; s++) {
    const type = sectors[s];
    const item = labels[type];
    const baseAngle = (s * Math.PI * 2) / 5;

    // Helper to add nodes easily
    const addNode = (id: string, r: number, angle: number, isNotable = false, customStats?: Record<string, number>, customName?: string, customDesc?: string) => {
      const x = Math.round(500 + r * Math.cos(angle));
      const y = Math.round(500 + r * Math.sin(angle));
      
      let val = (item.val * (r / 100) * 0.35) / 2; // Halved stats progress
      if (type === 'crit' || type === 'speed') {
        val = Math.round(val * 1000) / 1000;
      } else {
        val = Math.round(val * 10) / 10;
      }

      const displayVal = (type === 'crit' || type === 'speed') ? `${Math.round(val * 1000) / 10}%` : `${val}`;
      const name = customName || `${item.name} Tier ${Math.round(r / 80)}`;
      let desc = customDesc || `+${displayVal} ${item.desc}`;

      let stats = customStats || { [item.key]: val };
      if (customStats) {
        stats = {};
        for (const [k, v] of Object.entries(customStats)) {
          stats[k] = v / 2;
        }
      }

      if (customDesc) {
        // Halve all numbers in custom description (retaining up to 2 decimal places)
        desc = customDesc.replace(/(\d+(\.\d+)?)/g, (match) => {
          const num = parseFloat(match);
          const halved = num / 2;
          return String(Math.round(halved * 100) / 100);
        });
      }

      PASSIVE_SKILL_TREE[id] = {
        id,
        name,
        description: desc,
        x,
        y,
        stats,
        connections: [],
        type,
        isNotable
      };
    };

    // 1. Ring 1: Central Wheel Node
    const r1Id = `r1_${s}`;
    addNode(r1Id, 90, baseAngle);
    connect('start', r1Id);

    // 2. Ring 2: Inner Loop Path splits
    const r2IdA = `r2_${s}_a`;
    const r2IdB = `r2_${s}_b`;
    addNode(r2IdA, 180, baseAngle - 0.18);
    addNode(r2IdB, 180, baseAngle + 0.18);
    connect(r1Id, r2IdA);
    connect(r1Id, r2IdB);

    // Side Branches off Ring 2 (End-caps with choice notables)
    const r2SideA = `r2_${s}_side_a`;
    const r2SideB = `r2_${s}_side_b`;
    const r2NotA = `r2_${s}_notable_a`;
    const r2NotB = `r2_${s}_notable_b`;
    
    addNode(r2SideA, 200, baseAngle - 0.36);
    addNode(r2SideB, 200, baseAngle + 0.36);
    connect(r2IdA, r2SideA);
    connect(r2IdB, r2SideB);

    let notStats2A: Record<string, number> = {};
    let notStats2B: Record<string, number> = {};
    let name2A = '';
    let name2B = '';
    let desc2A = '';
    let desc2B = '';

    if (type === 'atk') {
      name2A = 'Might Notable: Heavy Impact';
      desc2A = '+4.5 Attack Power, +5% Physical Resistance';
      notStats2A = { attackPower: 4.5, physRes: 0.05 };
      name2B = 'Might Notable: Flurry Might';
      desc2B = '+4.5 Attack Power, +10% Crit Multiplier';
      notStats2B = { attackPower: 4.5, critMult: 0.10 };
    } else if (type === 'def') {
      name2A = 'Bulwark Notable: Thick Plate';
      desc2A = '+3.6 Defense, +5% Physical Resistance';
      notStats2A = { defense: 3.6, physRes: 0.05 };
      name2B = 'Bulwark Notable: Mirror Shards';
      desc2B = '+3.6 Defense, +5% Reflect Armor';
      notStats2B = { defense: 3.6, reflect: 0.05 };
    } else if (type === 'life') {
      name2A = 'Vigor Notable: Robust Health';
      desc2A = '+36 Max HP, +2% Lifesteal';
      notStats2A = { maxHp: 36, lifesteal: 0.02 };
      name2B = 'Vigor Notable: Herbal Cure';
      desc2B = '+36 Max HP, +5% Poison Resistance';
      notStats2B = { maxHp: 36, poisonRes: 0.05 };
    } else if (type === 'speed') {
      name2A = 'Celerity Notable: Fleet Foot';
      desc2A = '+6% Attack Speed, +5% Move Speed';
      notStats2A = { atkSpeedPct: 0.06, moveSpeedPct: 0.05 };
      name2B = 'Celerity Notable: Flow State';
      desc2B = '+6% Attack Speed, +4% Cooldown Reduction';
      notStats2B = { atkSpeedPct: 0.06, cdr: 0.04 };
    } else { // crit
      name2A = 'Precision Notable: Eagle Eye Init.';
      desc2A = '+4.5% Crit Chance, +15% Crit Multiplier';
      notStats2A = { critChance: 0.045, critMult: 0.15 };
      name2B = 'Precision Notable: Spell Focus';
      desc2B = '+4.5% Crit Chance, +4% Cooldown Reduction';
      notStats2B = { critChance: 0.045, cdr: 0.04 };
    }

    addNode(r2NotA, 250, baseAngle - 0.40, true, notStats2A, name2A, desc2A);
    addNode(r2NotB, 250, baseAngle + 0.40, true, notStats2B, name2B, desc2B);
    connect(r2SideA, r2NotA);
    connect(r2SideB, r2NotB);

    // Ring 3: Inner loop closure nodes
    const r3IdA = `r3_${s}_a`;
    const r3IdB = `r3_${s}_b`;
    const r3Junc = `r3_${s}_junc`;
    addNode(r3IdA, 270, baseAngle - 0.22);
    addNode(r3IdB, 270, baseAngle + 0.22);
    addNode(r3Junc, 310, baseAngle);
    connect(r2IdA, r3IdA);
    connect(r2IdB, r3IdB);
    connect(r3IdA, r3Junc);
    connect(r3IdB, r3Junc); // Loop closed!

    // Existing loop middle path C
    const r2IdC = `r2_${s}_c`;
    addNode(r2IdC, 180, baseAngle);
    connect(r1Id, r2IdC);

    const r3IdC = `r3_${s}_c`;
    let notStats3C: Record<string, number> = {};
    let name3C = '', desc3C = '';
    if (type === 'atk') {
      name3C = 'Might Notable: Iron Might';
      desc3C = '+5.0 Attack Power, +15 Max HP';
      notStats3C = { attackPower: 5.0, maxHp: 15 };
    } else if (type === 'def') {
      name3C = 'Bulwark Notable: Fortified Aegis';
      desc3C = '+4.0 Defense, +20 Max HP';
      notStats3C = { defense: 4.0, maxHp: 20 };
    } else if (type === 'life') {
      name3C = 'Vigor Notable: Vital Flow';
      desc3C = '+40 Max HP, +2% Lifesteal';
      notStats3C = { maxHp: 40, lifesteal: 0.02 };
    } else if (type === 'speed') {
      name3C = 'Celerity Notable: Wind Walker';
      desc3C = '+6% Attack Speed, +4% Move Speed';
      notStats3C = { atkSpeedPct: 0.06, moveSpeedPct: 0.04 };
    } else {
      name3C = 'Precision Notable: Keen Eye';
      desc3C = '+5% Crit Chance, +10% Crit Multiplier';
      notStats3C = { critChance: 0.05, critMult: 0.10 };
    }
    addNode(r3IdC, 270, baseAngle, true, notStats3C, name3C, desc3C);
    connect(r2IdC, r3IdC);
    connect(r3IdC, r3Junc);

    // 3. Ring 4: Intermediate Keystone & Gateway
    const r4Gate = `r4_${s}`;
    addNode(r4Gate, 390, baseAngle);
    connect(r3Junc, r4Gate);

    // Intermediate Keystones (distribute at Ring 4/radius 420)
    let keyId = '';
    let keyName = '';
    let keyDesc = '';
    if (type === 'atk') {
      keyId = 'r10_0';
      keyName = 'Keystone: Glass Cannon';
      keyDesc = 'Allocates Glass Cannon: +50% Attack Power, -30% Maximum HP';
    } else if (type === 'def') {
      keyId = 'r10_16';
      keyName = 'Keystone: Iron Fortress';
      keyDesc = 'Allocates Iron Fortress: Reflect 30% damage, -15% Move Speed';
    } else if (type === 'life') {
      keyId = 'r10_42';
      keyName = 'Keystone: Blood Magic';
      keyDesc = 'Allocates Blood Magic: +25% Max HP, 0% Cooldown Reduction';
    } else if (type === 'speed') {
      keyId = 'r10_48';
      keyName = 'Keystone: Alchemist Aura';
      keyDesc = 'Allocates Alchemist Aura: Double CDR, -20% Attack Power';
    } else { // crit
      keyId = 'r10_64';
      keyName = 'Keystone: Eagle Eye';
      keyDesc = 'Allocates Eagle Eye: +15% Crit Chance, -20% Max HP';
    }

    const xKey = Math.round(500 + 420 * Math.cos(baseAngle - 0.36));
    const yKey = Math.round(500 + 420 * Math.sin(baseAngle - 0.36));
    PASSIVE_SKILL_TREE[keyId] = {
      id: keyId,
      name: keyName,
      description: keyDesc,
      x: xKey,
      y: yKey,
      stats: {},
      connections: [],
      type,
      isKeystone: true
    };
    connect(r4Gate, keyId);

    // 4. Ring 5-7: Middle Loop Cluster
    const r5IdA = `r5_${s}_a`;
    const r5IdB = `r5_${s}_b`;
    addNode(r5IdA, 490, baseAngle - 0.20);
    addNode(r5IdB, 490, baseAngle + 0.20);
    connect(r4Gate, r5IdA);
    connect(r4Gate, r5IdB);

    const r6IdA = `r6_${s}_a`;
    const r6IdB = `r6_${s}_b`;
    addNode(r6IdA, 590, baseAngle - 0.24);
    addNode(r6IdB, 590, baseAngle + 0.24);
    connect(r5IdA, r6IdA);
    connect(r5IdB, r6IdB);

    // Side Branches off Ring 6
    const r6SideA = `r6_${s}_side_a`;
    const r6SideB = `r6_${s}_side_b`;
    const r6NotA = `r6_${s}_notable_a`;
    const r6NotB = `r6_${s}_notable_b`;
    
    addNode(r6SideA, 610, baseAngle - 0.42);
    addNode(r6SideB, 610, baseAngle + 0.42);
    connect(r6IdA, r6SideA);
    connect(r6IdB, r6SideB);

    let notStats6A: Record<string, number> = {};
    let notStats6B: Record<string, number> = {};
    let name6A = '';
    let name6B = '';
    let desc6A = '';
    let desc6B = '';

    if (type === 'atk') {
      name6A = 'Might Notable: Fire Brand';
      desc6A = '+6.0 Attack Power, +8% Fire Resistance';
      notStats6A = { attackPower: 6.0, fireRes: 0.08 };
      name6B = 'Might Notable: Frost Blade';
      desc6B = '+6.0 Attack Power, +8% Cold Resistance';
      notStats6B = { attackPower: 6.0, coldRes: 0.08 };
    } else if (type === 'def') {
      name6A = 'Bulwark Notable: Fire Ward';
      desc6A = '+5.0 Defense, +8% Fire Resistance';
      notStats6A = { defense: 5.0, fireRes: 0.08 };
      name6B = 'Bulwark Notable: Frost Ward';
      desc6B = '+5.0 Defense, +8% Cold Resistance';
      notStats6B = { defense: 5.0, coldRes: 0.08 };
    } else if (type === 'life') {
      name6A = 'Vigor Notable: Vital Recovery';
      desc6A = '+50 Max HP, +8% Cold Resistance';
      notStats6A = { maxHp: 50, coldRes: 0.08 };
      name6B = 'Vigor Notable: Toxic Remedy';
      desc6B = '+50 Max HP, +8% Poison Resistance';
      notStats6B = { maxHp: 50, poisonRes: 0.08 };
    } else if (type === 'speed') {
      name6A = 'Celerity Notable: Lightning Reflexes';
      desc6A = '+8% Attack Speed, +6% Reflect Armor';
      notStats6A = { atkSpeedPct: 0.08, reflect: 0.06 };
      name6B = 'Celerity Notable: Acid Alchemist';
      desc6B = '+8% Attack Speed, +8% Poison Resistance';
      notStats6B = { atkSpeedPct: 0.08, poisonRes: 0.08 };
    } else { // crit
      name6A = 'Precision Notable: Flawless Execution';
      desc6A = '+6% Crit Chance, +6% Physical Resistance';
      notStats6A = { critChance: 0.06, physRes: 0.06 };
      name6B = 'Precision Notable: Fatal Toxin';
      desc6B = '+6% Crit Chance, +8% Poison Resistance';
      notStats6B = { critChance: 0.06, poisonRes: 0.08 };
    }

    addNode(r6NotA, 660, baseAngle - 0.44, true, notStats6A, name6A, desc6A);
    addNode(r6NotB, 660, baseAngle + 0.44, true, notStats6B, name6B, desc6B);
    connect(r6SideA, r6NotA);
    connect(r6SideB, r6NotB);

    const r7IdA = `r7_${s}_a`;
    const r7IdB = `r7_${s}_b`;
    const r7Junc = `r7_${s}_junc`;
    addNode(r7IdA, 690, baseAngle - 0.22);
    addNode(r7IdB, 690, baseAngle + 0.22);
    addNode(r7Junc, 730, baseAngle);
    connect(r6IdA, r7IdA);
    connect(r6IdB, r7IdB);
    connect(r7IdA, r7Junc);
    connect(r7IdB, r7Junc); // Middle Loop closed!

    // Middle Loop path C
    const r5IdC = `r5_${s}_c`;
    addNode(r5IdC, 490, baseAngle);
    connect(r4Gate, r5IdC);

    const r6IdC = `r6_${s}_c`;
    let notStats6C: Record<string, number> = {};
    let name6C = '', desc6C = '';
    if (type === 'atk') {
      name6C = 'Might Notable: Volcanic Heart';
      desc6C = '+6.5 Attack Power, +10% Fire Resistance';
      notStats6C = { attackPower: 6.5, fireRes: 0.10 };
    } else if (type === 'def') {
      name6C = 'Bulwark Notable: Glacier Guard';
      desc6C = '+5.5 Defense, +10% Cold Resistance';
      notStats6C = { defense: 5.5, coldRes: 0.10 };
    } else if (type === 'life') {
      name6C = 'Vigor Notable: Poison Remedy';
      desc6C = '+60 Max HP, +10% Poison Resistance';
      notStats6C = { maxHp: 60, poisonRes: 0.10 };
    } else if (type === 'speed') {
      name6C = 'Celerity Notable: Static Charge';
      desc6C = '+8% Attack Speed, +6% Reflect Armor';
      notStats6C = { atkSpeedPct: 0.08, reflect: 0.06 };
    } else {
      name6C = 'Precision Notable: Acid Crit';
      desc6C = '+7% Crit Chance, +8% Poison Resistance';
      notStats6C = { critChance: 0.07, poisonRes: 0.08 };
    }
    addNode(r6IdC, 590, baseAngle, true, notStats6C, name6C, desc6C);
    connect(r5IdC, r6IdC);

    const r7IdC = `r7_${s}_c`;
    addNode(r7IdC, 690, baseAngle);
    connect(r6IdC, r7IdC);
    connect(r7IdC, r7Junc);

    // 5. Ring 8: Outer Highway Node
    const r8Id = `r8_${s}`;
    addNode(r8Id, 830, baseAngle);
    connect(r7Junc, r8Id);

    // 6. Ring 9: Outer Loop Cluster
    const r9IdA = `r9_${s}_a`;
    const r9IdB = `r9_${s}_b`;
    addNode(r9IdA, 930, baseAngle - 0.18);
    addNode(r9IdB, 930, baseAngle + 0.18);
    connect(r8Id, r9IdA);
    connect(r8Id, r9IdB);

    // Side Branches off Ring 9
    const r9SideA = `r9_${s}_side_a`;
    const r9SideB = `r9_${s}_side_b`;
    const r9NotA = `r9_${s}_notable_a`;
    const r9NotB = `r9_${s}_notable_b`;
    
    addNode(r9SideA, 950, baseAngle - 0.38);
    addNode(r9SideB, 950, baseAngle + 0.38);
    connect(r9IdA, r9SideA);
    connect(r9IdB, r9SideB);

    let notStats9A: Record<string, number> = {};
    let notStats9B: Record<string, number> = {};
    let name9A = '';
    let name9B = '';
    let desc9A = '';
    let desc9B = '';

    if (type === 'atk') {
      name9A = 'Might Notable: Physical Sunder';
      desc9A = '+7.5 Attack Power, +5% Physical Resistance';
      notStats9A = { attackPower: 7.5, physRes: 0.05 };
      name9B = 'Might Notable: Brutal Precision';
      desc9B = '+7.5 Attack Power, +2% Crit Chance';
      notStats9B = { attackPower: 7.5, critChance: 0.02 };
    } else if (type === 'def') {
      name9A = 'Bulwark Notable: Reinforced Shell';
      desc9A = '+6.0 Defense, +6% Reflect Armor';
      notStats9A = { defense: 6.0, reflect: 0.06 };
      name9B = 'Bulwark Notable: Solid Ward';
      desc9B = '+6.0 Defense, +5% Poison Resistance';
      notStats9B = { defense: 6.0, poisonRes: 0.05 };
    } else if (type === 'life') {
      name9A = 'Vigor Notable: Immortal Spirit';
      desc9A = '+60 Max HP, +3% Lifesteal';
      notStats9A = { maxHp: 60, lifesteal: 0.03 };
      name9B = 'Vigor Notable: Hardened Core';
      desc9B = '+60 Max HP, +5% Physical Resistance';
      notStats9B = { maxHp: 60, physRes: 0.05 };
    } else if (type === 'speed') {
      name9A = 'Celerity Notable: Quick Step';
      desc9A = '+10% Attack Speed, +5% Move Speed';
      notStats9A = { atkSpeedPct: 0.10, moveSpeedPct: 0.05 };
      name9B = 'Celerity Notable: Haste Mastery';
      desc9B = '+10% Attack Speed, +5% Cooldown Reduction';
      notStats9B = { atkSpeedPct: 0.10, cdr: 0.05 };
    } else { // crit
      name9A = 'Precision Notable: Deadly Precision';
      desc9A = '+7.5% Crit Chance, +20% Crit Multiplier';
      notStats9A = { critChance: 0.075, critMult: 0.20 };
      name9B = 'Precision Notable: Frost Crit';
      desc9B = '+7.5% Crit Chance, +8% Cold Resistance';
      notStats9B = { critChance: 0.075, coldRes: 0.08 };
    }

    addNode(r9NotA, 1000, baseAngle - 0.40, true, notStats9A, name9A, desc9A);
    addNode(r9NotB, 1000, baseAngle + 0.40, true, notStats9B, name9B, desc9B);
    connect(r9SideA, r9NotA);
    connect(r9SideB, r9NotB);

    const r9Junc = `r9_${s}_junc`;
    addNode(r9Junc, 970, baseAngle);
    connect(r9IdA, r9Junc);
    connect(r9IdB, r9Junc); // Outer Loop closed!

    // Outer Loop path C
    const r9IdC = `r9_${s}_c`;
    let notStats9C: Record<string, number> = {};
    let name9C = '', desc9C = '';
    if (type === 'atk') {
      name9C = 'Might Notable: Bloodthirst';
      desc9C = '+8.0 Attack Power, +4% Lifesteal';
      notStats9C = { attackPower: 8.0, lifesteal: 0.04 };
    } else if (type === 'def') {
      name9C = 'Bulwark Notable: Thorns Edge';
      desc9C = '+7.0 Defense, +8% Reflect Armor';
      notStats9C = { defense: 7.0, reflect: 0.08 };
    } else if (type === 'life') {
      name9C = 'Vigor Notable: Vampiric Essence';
      desc9C = '+70 Max HP, +4% Lifesteal';
      notStats9C = { maxHp: 70, lifesteal: 0.04 };
    } else if (type === 'speed') {
      name9C = 'Celerity Notable: Hyperdrive';
      desc9C = '+10% Attack Speed, +5% Cooldown Reduction';
      notStats9C = { atkSpeedPct: 0.10, cdr: 0.05 };
    } else {
      name9C = 'Precision Notable: Lethal Focus';
      desc9C = '+8% Crit Chance, +5% Cooldown Reduction';
      notStats9C = { critChance: 0.08, cdr: 0.05 };
    }
    addNode(r9IdC, 930, baseAngle, true, notStats9C, name9C, desc9C);
    connect(r8Id, r9IdC);
    connect(r9IdC, r9Junc);

    // 7. Ring 10: Outer Keystones (radius 1070)
    let outerKey1Id = '';
    let outerKey1Name = '';
    let outerKey1Desc = '';
    let outerKey2Id = '';
    let outerKey2Name = '';
    let outerKey2Desc = '';

    if (type === 'atk') {
      outerKey1Id = 'r10_5';
      outerKey1Name = 'Keystone: Resolute Technique';
      outerKey1Desc = 'Allocates Resolute Technique: +40% Attack Power, 0% Crit Chance';
      outerKey2Id = 'r10_10';
      outerKey2Name = 'Keystone: Elemental Overload';
      outerKey2Desc = 'Allocates Elemental Overload: +35% Attack Power, -30% Defense';
    } else if (type === 'def') {
      outerKey1Id = 'r10_21';
      outerKey1Name = 'Keystone: Unwavering Stance';
      outerKey1Desc = 'Allocates Unwavering Stance: +50% Defense, -15% Move Speed, 0% Reflect';
      outerKey2Id = 'r10_26';
      outerKey2Name = 'Keystone: Juggernaut Bulwark';
      outerKey2Desc = 'Allocates Juggernaut Bulwark: +35% Reflect, +25% Max HP, -40% Defense';
    } else if (type === 'life') {
      outerKey1Id = 'r10_32';
      outerKey1Name = 'Keystone: Vampiric Zeal';
      outerKey1Desc = 'Allocates Vampiric Zeal: +25% Lifesteal, -30% Max HP';
      outerKey2Id = 'r10_37';
      outerKey2Name = 'Keystone: Ghost Reaver';
      outerKey2Desc = 'Allocates Ghost Reaver: +45% Max HP, +20% Reflect, 0% Lifesteal';
    } else if (type === 'speed') {
      outerKey1Id = 'r10_53';
      outerKey1Name = 'Keystone: Conduit';
      outerKey1Desc = 'Allocates Conduit: +35% Cooldown Reduction, -35% Defense';
      outerKey2Id = 'r10_58';
      outerKey2Name = 'Keystone: Swift Reflexes';
      outerKey2Desc = 'Allocates Swift Reflexes: +30% Attack Speed, 0% Cooldown Reduction';
    } else { // crit
      outerKey1Id = 'r10_69';
      outerKey1Name = 'Keystone: Assassin Pact';
      outerKey1Desc = 'Allocates Assassin Pact: +60% Crit Multiplier, -30% Defense';
      outerKey2Id = 'r10_74';
      outerKey2Name = 'Keystone: Perfect Agility';
      outerKey2Desc = 'Allocates Perfect Agility: +20% Crit Chance, -40% Crit Multiplier';
    }

    const xKey1 = Math.round(500 + 1070 * Math.cos(baseAngle - 0.24));
    const yKey1 = Math.round(500 + 1070 * Math.sin(baseAngle - 0.24));
    PASSIVE_SKILL_TREE[outerKey1Id] = {
      id: outerKey1Id,
      name: outerKey1Name,
      description: outerKey1Desc,
      x: xKey1,
      y: yKey1,
      stats: {},
      connections: [],
      type,
      isKeystone: true
    };
    connect(r9Junc, outerKey1Id);

    const xKey2 = Math.round(500 + 1070 * Math.cos(baseAngle + 0.24));
    const yKey2 = Math.round(500 + 1070 * Math.sin(baseAngle + 0.24));
    PASSIVE_SKILL_TREE[outerKey2Id] = {
      id: outerKey2Id,
      name: outerKey2Name,
      description: outerKey2Desc,
      x: xKey2,
      y: yKey2,
      stats: {},
      connections: [],
      type,
      isKeystone: true
    };
    connect(r9Junc, outerKey2Id);

    // Celestial Loop (Loop 4: Rings 11, 12, 13, 14)
    const r11Id = `r11_${s}`;
    addNode(r11Id, 1200, baseAngle);
    connect(r9Junc, r11Id);

    const r12IdA = `r12_${s}_a`;
    const r12IdB = `r12_${s}_b`;
    const r12IdC = `r12_${s}_c`;
    addNode(r12IdA, 1330, baseAngle - 0.20);
    addNode(r12IdB, 1330, baseAngle + 0.20);
    addNode(r12IdC, 1330, baseAngle);
    connect(r11Id, r12IdA);
    connect(r11Id, r12IdB);
    connect(r11Id, r12IdC);

    const r12SideA = `r12_${s}_side_a`;
    const r12SideB = `r12_${s}_side_b`;
    const r12NotA = `r12_${s}_notable_a`;
    const r12NotB = `r12_${s}_notable_b`;
    const r12NotC = `r12_${s}_notable_c`;
    addNode(r12SideA, 1350, baseAngle - 0.38);
    addNode(r12SideB, 1350, baseAngle + 0.38);

    let celStatsA: Record<string, number> = {};
    let celStatsB: Record<string, number> = {};
    let celStatsC: Record<string, number> = {};
    let celNameA = '', celNameB = '', celNameC = '';
    let celDescA = '', celDescB = '', celDescC = '';

    if (type === 'atk') {
      celNameA = 'Celestial Might: Giant Slayer';
      celDescA = '+10.0 Attack Power, +5% Physical Resistance';
      celStatsA = { attackPower: 10.0, physRes: 0.05 };
      celNameB = 'Celestial Might: Heavy Blows';
      celDescB = '+10.0 Attack Power, +15% Crit Multiplier';
      celStatsB = { attackPower: 10.0, critMult: 0.15 };
      celNameC = 'Celestial Might: Overwhelm';
      celDescC = '+12.0 Attack Power';
      celStatsC = { attackPower: 12.0 };
    } else if (type === 'def') {
      celNameA = 'Celestial Bulwark: Unyielding';
      celDescA = '+8.0 Defense, +6% Physical Resistance';
      celStatsA = { defense: 8.0, physRes: 0.06 };
      celNameB = 'Celestial Bulwark: Retribution Ward';
      celDescB = '+8.0 Defense, +10% Reflect Armor';
      celStatsB = { defense: 8.0, reflect: 0.10 };
      celNameC = 'Celestial Bulwark: Iron Bastion';
      celDescC = '+10.0 Defense';
      celStatsC = { defense: 10.0 };
    } else if (type === 'life') {
      celNameA = 'Celestial Vigor: Warmonger';
      celDescA = '+80 Max HP, +4% Lifesteal';
      celStatsA = { maxHp: 80, lifesteal: 0.04 };
      celNameB = 'Celestial Vigor: Vital Bulwark';
      celDescB = '+80 Max HP, +6% Physical Resistance';
      celStatsB = { maxHp: 80, physRes: 0.06 };
      celNameC = 'Celestial Vigor: Colossus Growth';
      celDescC = '+100 Max HP';
      celStatsC = { maxHp: 100 };
    } else if (type === 'speed') {
      celNameA = 'Celestial Celerity: Swift Striker';
      celDescA = '+12% Attack Speed, +5% Move Speed';
      celStatsA = { atkSpeedPct: 0.12, moveSpeedPct: 0.05 };
      celNameB = 'Celestial Celerity: Spell Weaver';
      celDescB = '+12% Attack Speed, +6% Cooldown Reduction';
      celStatsB = { atkSpeedPct: 0.12, cdr: 0.06 };
      celNameC = 'Celestial Celerity: Time Bend';
      celDescC = '+15% Attack Speed';
      celStatsC = { atkSpeedPct: 0.15 };
    } else {
      celNameA = 'Celestial Precision: Assassin Mark';
      celDescA = '+10% Crit Chance, +20% Crit Multiplier';
      celStatsA = { critChance: 0.10, critMult: 0.20 };
      celNameB = 'Celestial Precision: Mind Focus';
      celDescB = '+10% Crit Chance, +6% Cooldown Reduction';
      celStatsB = { critChance: 0.10, cdr: 0.06 };
      celNameC = 'Celestial Precision: Flawless Aim';
      celDescC = '+12% Crit Chance';
      celStatsC = { critChance: 0.12 };
    }

    addNode(r12NotA, 1400, baseAngle - 0.42, true, celStatsA, celNameA, celDescA);
    addNode(r12NotB, 1400, baseAngle + 0.42, true, celStatsB, celNameB, celDescB);
    addNode(r12NotC, 1400, baseAngle, true, celStatsC, celNameC, celDescC);

    connect(r12IdA, r12SideA);
    connect(r12SideA, r12NotA);
    connect(r12IdB, r12SideB);
    connect(r12SideB, r12NotB);

    const r13IdA = `r13_${s}_a`;
    const r13IdB = `r13_${s}_b`;
    const r13IdC = `r13_${s}_c`;
    const r13Junc = `r13_${s}_junc`;

    addNode(r13IdA, 1460, baseAngle - 0.22);
    addNode(r13IdB, 1460, baseAngle + 0.22);
    addNode(r13IdC, 1460, baseAngle);
    addNode(r13Junc, 1500, baseAngle);

    connect(r12IdA, r13IdA);
    connect(r12IdB, r13IdB);
    connect(r12IdC, r12NotC);
    connect(r12NotC, r13IdC);

    connect(r13IdA, r13Junc);
    connect(r13IdB, r13Junc);
    connect(r13IdC, r13Junc);

    // Celestial Keystones at Ring 14 (Radius 1620)
    let celKey1Id = `r14_${s}_key1`;
    let celKey1Name = '';
    let celKey1Desc = '';
    let celKey2Id = `r14_${s}_key2`;
    let celKey2Name = '';
    let celKey2Desc = '';

    if (type === 'atk') {
      celKey1Name = "Keystone: Titan's Grip";
      celKey1Desc = "Allocates Titan's Grip: +50% Attack Power, -25% Attack Speed";
      celKey2Name = 'Keystone: Bloodthirst';
      celKey2Desc = 'Allocates Bloodthirst: +25% Crit Chance, -30% Attack Power';
    } else if (type === 'def') {
      celKey1Name = 'Keystone: Indomitable Bastion';
      celKey1Desc = 'Allocates Indomitable Bastion: +40% Defense, -15% Attack Power';
      celKey2Name = 'Keystone: Retribution Shield';
      celKey2Desc = 'Allocates Retribution Shield: +30% Reflect, -30% Defense';
    } else if (type === 'life') {
      celKey1Name = 'Keystone: Soul Feast';
      celKey1Desc = 'Allocates Soul Feast: +20% Lifesteal, -25% Max HP';
      celKey2Name = 'Keystone: Colossus';
      celKey2Desc = 'Allocates Colossus: +40% Max HP, 0% Lifesteal';
    } else if (type === 'speed') {
      celKey1Name = 'Keystone: Flicker Step';
      celKey1Desc = 'Allocates Flicker Step: +35% Cooldown Reduction, -20% Attack Speed';
      celKey2Name = 'Keystone: Zephyr Wind';
      celKey2Desc = 'Allocates Zephyr Wind: +30% Attack Speed, -20% Maximum HP';
    } else {
      celKey1Name = "Keystone: Assassin's Mark";
      celKey1Desc = "Allocates Assassin's Mark: +60% Crit Multiplier, -20% Crit Chance";
      celKey2Name = 'Keystone: Eagle Eye Focus';
      celKey2Desc = 'Allocates Eagle Eye Focus: +25% Crit Chance, -40% Crit Multiplier';
    }

    const xCelKey1 = Math.round(500 + 1620 * Math.cos(baseAngle - 0.24));
    const yCelKey1 = Math.round(500 + 1620 * Math.sin(baseAngle - 0.24));
    PASSIVE_SKILL_TREE[celKey1Id] = {
      id: celKey1Id,
      name: celKey1Name,
      description: celKey1Desc,
      x: xCelKey1,
      y: yCelKey1,
      stats: {},
      connections: [],
      type,
      isKeystone: true
    };
    connect(r13Junc, celKey1Id);

    const xCelKey2 = Math.round(500 + 1620 * Math.cos(baseAngle + 0.24));
    const yCelKey2 = Math.round(500 + 1620 * Math.sin(baseAngle + 0.24));
    PASSIVE_SKILL_TREE[celKey2Id] = {
      id: celKey2Id,
      name: celKey2Name,
      description: celKey2Desc,
      x: xCelKey2,
      y: yCelKey2,
      stats: {},
      connections: [],
      type,
      isKeystone: true
    };
    connect(r13Junc, celKey2Id);


    // Void Loop (Loop 5: Rings 15, 16, 17, 18)
    const r15Id = `r15_${s}`;
    addNode(r15Id, 1750, baseAngle);
    connect(r13Junc, r15Id);

    const r16IdA = `r16_${s}_a`;
    const r16IdB = `r16_${s}_b`;
    const r16IdC = `r16_${s}_c`;
    addNode(r16IdA, 1880, baseAngle - 0.20);
    addNode(r16IdB, 1880, baseAngle + 0.20);
    addNode(r16IdC, 1880, baseAngle);
    connect(r15Id, r16IdA);
    connect(r15Id, r16IdB);
    connect(r15Id, r16IdC);

    const r16SideA = `r16_${s}_side_a`;
    const r16SideB = `r16_${s}_side_b`;
    const r16NotA = `r16_${s}_notable_a`;
    const r16NotB = `r16_${s}_notable_b`;
    const r16NotC = `r16_${s}_notable_c`;
    addNode(r16SideA, 1900, baseAngle - 0.38);
    addNode(r16SideB, 1900, baseAngle + 0.38);

    let voidStatsA: Record<string, number> = {};
    let voidStatsB: Record<string, number> = {};
    let voidStatsC: Record<string, number> = {};
    let voidNameA = '', voidNameB = '', voidNameC = '';
    let voidDescA = '', voidDescB = '', voidDescC = '';

    if (type === 'atk') {
      voidNameA = 'Void Might: Abyssal Edge';
      voidDescA = '+15.0 Attack Power, +6% Physical Resistance';
      voidStatsA = { attackPower: 15.0, physRes: 0.06 };
      voidNameB = 'Void Might: Doomsday Crit';
      voidDescB = '+15.0 Attack Power, +20% Crit Multiplier';
      voidStatsB = { attackPower: 15.0, critMult: 0.20 };
      voidNameC = 'Void Might: Star Shatterer';
      voidDescC = '+20.0 Attack Power';
      voidStatsC = { attackPower: 20.0 };
    } else if (type === 'def') {
      voidNameA = 'Void Bulwark: Obsidian Wall';
      voidDescA = '+12.0 Defense, +8% Physical Resistance';
      voidStatsA = { defense: 12.0, physRes: 0.08 };
      voidNameB = 'Void Bulwark: Cosmic Reflection';
      voidDescB = '+12.0 Defense, +15% Reflect Armor';
      voidStatsB = { defense: 12.0, reflect: 0.15 };
      voidNameC = 'Void Bulwark: Titan Bastion';
      voidDescC = '+15.0 Defense';
      voidStatsC = { defense: 15.0 };
    } else if (type === 'life') {
      voidNameA = 'Void Vigor: Soul Reaper';
      voidDescA = '+120 Max HP, +6% Lifesteal';
      voidStatsA = { maxHp: 120, lifesteal: 0.06 };
      voidNameB = 'Void Vigor: Void Shielding';
      voidDescB = '+120 Max HP, +8% Physical Resistance';
      voidStatsB = { maxHp: 120, physRes: 0.08 };
      voidNameC = 'Void Vigor: Astral Fountain';
      voidDescC = '+150 Max HP';
      voidStatsC = { maxHp: 150 };
    } else if (type === 'speed') {
      voidNameA = 'Void Celerity: Shadow Step';
      voidDescA = '+16% Attack Speed, +6% Move Speed';
      voidStatsA = { atkSpeedPct: 0.16, moveSpeedPct: 0.06 };
      voidNameB = 'Void Celerity: Astral Haste';
      voidDescB = '+16% Attack Speed, +8% Cooldown Reduction';
      voidStatsB = { atkSpeedPct: 0.16, cdr: 0.08 };
      voidNameC = 'Void Celerity: Speed Demon';
      voidDescC = '+20% Attack Speed';
      voidStatsC = { atkSpeedPct: 0.20 };
    } else {
      voidNameA = 'Void Precision: Void Executioner';
      voidDescA = '+14% Crit Chance, +25% Crit Multiplier';
      voidStatsA = { critChance: 0.14, critMult: 0.25 };
      voidNameB = 'Void Precision: Reality Rift';
      voidDescB = '+14% Crit Chance, +8% Cooldown Reduction';
      voidStatsB = { critChance: 0.14, cdr: 0.08 };
      voidNameC = 'Void Precision: Omega Strike';
      voidDescC = '+18% Crit Chance';
      voidStatsC = { critChance: 0.18 };
    }

    addNode(r16NotA, 1950, baseAngle - 0.42, true, voidStatsA, voidNameA, voidDescA);
    addNode(r16NotB, 1950, baseAngle + 0.42, true, voidStatsB, voidNameB, voidDescB);
    addNode(r16NotC, 1950, baseAngle, true, voidStatsC, voidNameC, voidDescC);

    connect(r16IdA, r16SideA);
    connect(r16SideA, r16NotA);
    connect(r16IdB, r16SideB);
    connect(r16SideB, r16NotB);

    const r17IdA = `r17_${s}_a`;
    const r17IdB = `r17_${s}_b`;
    const r17IdC = `r17_${s}_c`;
    const r17Junc = `r17_${s}_junc`;

    addNode(r17IdA, 2010, baseAngle - 0.22);
    addNode(r17IdB, 2010, baseAngle + 0.22);
    addNode(r17IdC, 2010, baseAngle);
    addNode(r17Junc, 2050, baseAngle);

    connect(r16IdA, r17IdA);
    connect(r16IdB, r17IdB);
    connect(r16IdC, r16NotC);
    connect(r16NotC, r17IdC);

    connect(r17IdA, r17Junc);
    connect(r17IdB, r17Junc);
    connect(r17IdC, r17Junc);

    // Void Keystones at Ring 18 (Radius 2170)
    let voidKey1Id = `r18_${s}_key1`;
    let voidKey1Name = '';
    let voidKey1Desc = '';
    let voidKey2Id = `r18_${s}_key2`;
    let voidKey2Name = '';
    let voidKey2Desc = '';

    if (type === 'atk') {
      voidKey1Name = 'Keystone: Divine Fervor';
      voidKey1Desc = 'Allocates Divine Fervor: +40% Attack Speed, -30% Defense';
      voidKey2Name = 'Keystone: Desperate Strike';
      voidKey2Desc = 'Allocates Desperate Strike: +75% Crit Multiplier, -30% Attack Speed';
    } else if (type === 'def') {
      voidKey1Name = 'Keystone: Iron Aegis';
      voidKey1Desc = 'Allocates Iron Aegis: +30% Physical Resistance, 0% Fire/Cold/Poison Resistance';
      voidKey2Name = 'Keystone: Magma Ward';
      voidKey2Desc = 'Allocates Magma Ward: +20% Fire, Cold, and Poison Resistance, 0% Physical Resistance';
    } else if (type === 'life') {
      voidKey1Name = 'Keystone: Adrenaline Rush';
      voidKey1Desc = 'Allocates Adrenaline Rush: +30% Attack Speed, -20% Maximum HP';
      voidKey2Name = 'Keystone: Undying Will';
      voidKey2Desc = 'Allocates Undying Will: +30% Cooldown Reduction, -25% Attack Speed';
    } else if (type === 'speed') {
      voidKey1Name = 'Keystone: Hypercharge';
      voidKey1Desc = 'Allocates Hypercharge: +50% Cooldown Reduction, -40% Attack Power';
      voidKey2Name = 'Keystone: Overdrive';
      voidKey2Desc = 'Allocates Overdrive: +40% Attack Speed, -15% Physical Resistance';
    } else {
      voidKey1Name = 'Keystone: Lethal Precision';
      voidKey1Desc = 'Allocates Lethal Precision: +40% Crit Chance, -30% Crit Multiplier';
      voidKey2Name = "Keystone: Slayer's Focus";
      voidKey2Desc = "Allocates Slayer's Focus: +80% Crit Multiplier, -25% Crit Chance";
    }

    const xVoidKey1 = Math.round(500 + 2170 * Math.cos(baseAngle - 0.24));
    const yVoidKey1 = Math.round(500 + 2170 * Math.sin(baseAngle - 0.24));
    PASSIVE_SKILL_TREE[voidKey1Id] = {
      id: voidKey1Id,
      name: voidKey1Name,
      description: voidKey1Desc,
      x: xVoidKey1,
      y: yVoidKey1,
      stats: {},
      connections: [],
      type,
      isKeystone: true
    };
    connect(r17Junc, voidKey1Id);

    const xVoidKey2 = Math.round(500 + 2170 * Math.cos(baseAngle + 0.24));
    const yVoidKey2 = Math.round(500 + 2170 * Math.sin(baseAngle + 0.24));
    PASSIVE_SKILL_TREE[voidKey2Id] = {
      id: voidKey2Id,
      name: voidKey2Name,
      description: voidKey2Desc,
      x: xVoidKey2,
      y: yVoidKey2,
      stats: {},
      connections: [],
      type,
      isKeystone: true
    };
    connect(r17Junc, voidKey2Id);
  }

  // Ring 1 central wheel links (connect adjacent sector starters)
  for (let s = 0; s < 5; s++) {
    connect(`r1_${s}`, `r1_${(s + 1) % 5}`);
  }

  // Ring 2 inner notable highways
  for (let s = 0; s < 5; s++) {
    connect(`r2_${s}_notable_b`, `r2_${(s + 1) % 5}_notable_a`);
  }

  // Ring 6 middle notable highways
  for (let s = 0; s < 5; s++) {
    connect(`r6_${s}_notable_b`, `r6_${(s + 1) % 5}_notable_a`);
  }

  // Ring 9 outer notable highways
  for (let s = 0; s < 5; s++) {
    connect(`r9_${s}_notable_b`, `r9_${(s + 1) % 5}_notable_a`);
  }

  // Ring 12 celestial notable highways
  for (let s = 0; s < 5; s++) {
    connect(`r12_${s}_notable_b`, `r12_${(s + 1) % 5}_notable_a`);
  }

  // Ring 16 void notable highways
  for (let s = 0; s < 5; s++) {
    connect(`r16_${s}_notable_b`, `r16_${(s + 1) % 5}_notable_a`);
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
  enemySprite: string;
  enemyNames: string[];
  desc: string;
  bgColor: string;
  detailColor: string;
}

export const ARENA_CONFIGS: Record<number, ArenaConfig> = {
  1: { name: 'Forest of Trials', level: 1, theme: 'FOREST', enemySprite: 'GOBLIN_SCOUT', enemyNames: ['Goblin Scout', 'Goblin Thief'], desc: 'A dense wood where goblins roam. Ideal for starters.', bgColor: '#08170e', detailColor: '#0f2919' },
  5: { name: 'Echoing Groves', level: 5, theme: 'FOREST', enemySprite: 'GOBLIN_RAIDER', enemyNames: ['Goblin Raider', 'Goblin Archer'], desc: 'Deeper into the forest, goblin scouts set traps.', bgColor: '#06130b', detailColor: '#0a1d11' },
  10: { name: 'Serpent Caves', level: 10, theme: 'POISON_CAVES', enemySprite: 'YOUNG_ADDER', enemyNames: ['Young Adder', 'Green Snake'], desc: 'Damp caverns containing slithering neon adders.', bgColor: '#0b0512', detailColor: '#8a2be2' },
  15: { name: 'Neon Caves', level: 15, theme: 'POISON_CAVES', enemySprite: 'NEON_VIPER', enemyNames: ['Spitting Adder', 'Slither Viper'], desc: 'Glowing crystal tunnels with swift venomous snakes.', bgColor: '#050a14', detailColor: '#00ffff' },
  20: { name: 'Whispering Woods', level: 20, theme: 'FOREST', enemySprite: 'FERAL_GOBLIN', enemyNames: ['Feral Goblin', 'Forest Goblin'], desc: 'Haunted woodlands where rogue goblins hide.', bgColor: '#03080c', detailColor: '#0b1d28' },
  25: { name: 'Orc Campsite', level: 25, theme: 'RUINS', enemySprite: 'ORC_VANGUARD', enemyNames: ['Orc Vanguard', 'Orc Scout'], desc: 'A temporary camp set up by vanguard orc grunts.', bgColor: '#141210', detailColor: '#201c18' },
  30: { name: 'Skeletal Catacombs', level: 30, theme: 'CRYPT', enemySprite: 'SKELETAL_GRUNT', enemyNames: ['Skeletal Grunt', 'Rattled Skeleton'], desc: 'Underground catacombs guarded by skeletal warriors.', bgColor: '#07080b', detailColor: '#1e3a8a' },
  35: { name: 'Obsidian Ruins', level: 35, theme: 'RUINS', enemySprite: 'ORC_RAIDER', enemyNames: ['Orc Grunt', 'Orc Raider'], desc: 'Cursed obsidian pillars and heavy orc raiders.', bgColor: '#110b08', detailColor: '#281a13' },
  40: { name: 'Poison Gardens', level: 40, theme: 'POISON_CAVES', enemySprite: 'TOXIC_COBRA', enemyNames: ['Poisonous Cobra', 'Giant Mamba'], desc: 'Overgrown ruins rich with toxic fumes and slithering vipers.', bgColor: '#0d1a0d', detailColor: '#10b981' },
  45: { name: 'Orc Stronghold', level: 45, theme: 'RUINS', enemySprite: 'ORC_BERSERKER', enemyNames: ['Orc Berserker', 'Orc Gladiator'], desc: 'A heavily fortified encampment of orc berserkers.', bgColor: '#1a1510', detailColor: '#302820' },
  50: { name: 'Catacombs of Doom', level: 50, theme: 'CRYPT', enemySprite: 'SKELETAL_ACOLYTE', enemyNames: ['Skeletal Guard', 'Crypt Wight'], desc: 'Deep chambers where ancient skeleton acolytes practice necromancy.', bgColor: '#030712', detailColor: '#3b82f6' },
  55: { name: 'Lich Crypt', level: 55, theme: 'CRYPT', enemySprite: 'LICH_ACOLYTE', enemyNames: ['Lich Acolyte', 'Ancient Mummy'], desc: 'A dark, cold maze guarded by ancient skeleton acolyths.', bgColor: '#0f172a', detailColor: '#6366f1' },
  60: { name: 'Ancient Fortress', level: 60, theme: 'RUINS', enemySprite: 'ORC_COMMANDER', enemyNames: ['Orc Commander', 'Orc Warlord'], desc: 'The historic keep of the orc kings, filled with elite warriors.', bgColor: '#1c1917', detailColor: '#44403c' },
  65: { name: 'Shadow Crypt', level: 65, theme: 'CRYPT', enemySprite: 'SKELETAL_LICH', enemyNames: ['Skeletal Lich', 'Wraith Priest'], desc: 'A void-touched tomb filled with skeleton liches.', bgColor: '#180018', detailColor: '#4b0082' },
  70: { name: 'Dragon Ridge', level: 70, theme: 'VOLCANO', enemySprite: 'VOLCANO_HATCHLING', enemyNames: ['Volcano Hatchling', 'Wyvern'], desc: 'Rocky volcanic cliffs populated by small fire drakes.', bgColor: '#1c0a00', detailColor: '#d97706' },
  75: { name: 'Volcanic Caldera', level: 75, theme: 'VOLCANO', enemySprite: 'VOLCANO_DRAGON', enemyNames: ['Young Drake', 'Volcano Dragon'], desc: 'Lava flows, magma giants, and legendary fire dragons.', bgColor: '#0f0500', detailColor: '#ef4444' },
  80: { name: 'Frozen Tombs', level: 80, theme: 'CRYPT', enemySprite: 'FROST_WIGHT', enemyNames: ['Frost Skeleton', 'Lich Overlord'], desc: 'Icy crypts holding preserved ancient skeletal commanders.', bgColor: '#0f172a', detailColor: '#38bdf8' },
  85: { name: 'Magma Chamber', level: 85, theme: 'VOLCANO', enemySprite: 'MAGMA_DRAGON', enemyNames: ['Infernal Drake', 'Magma Dragon'], desc: 'Subterranean lava chambers guarded by high-rank lava dragons.', bgColor: '#0c0200', detailColor: '#f97316' },
  90: { name: 'Abyssal Maw', level: 90, theme: 'VOLCANO', enemySprite: 'VOID_DRAGON', enemyNames: ['Void Drake', 'Abyssal Dragon'], desc: 'The final frontier. Face the strongest challenges here.', bgColor: '#000000', detailColor: '#8b5cf6' },
  95: { name: 'Dragon Throne', level: 95, theme: 'VOLCANO', enemySprite: 'ANCIENT_SOVEREIGN', enemyNames: ['Ancient Sovereign', 'Lava Dragon King'], desc: 'The apex of the volcano. Defeat the ancient dragon sovereign.', bgColor: '#000000', detailColor: '#b91c1c' }
};

export const getArenaConfigForLevel = (level: number): ArenaConfig => {
  const levels = Object.keys(ARENA_CONFIGS).map(Number).sort((a, b) => a - b);
  let selectedLevel = levels[0];
  for (const l of levels) {
    if (l <= level) {
      selectedLevel = l;
    }
  }
  return ARENA_CONFIGS[selectedLevel];
};
