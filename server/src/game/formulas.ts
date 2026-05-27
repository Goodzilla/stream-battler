import { CLASSES, TALENTS, PASSIVE_SKILL_TREE } from './constants';

export interface ItemData {
  id?: string;
  name: string;
  slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  itemLevel: number;
  baseAttack: number;
  baseDefense: number;
  affixes: Array<{ type: string; value: number }>;
  isEquipped: boolean;
}

export interface CharacterStats {
  maxHp: number;
  attackPower: number;
  defense: number;
  critChance: number;
  critMult: number;
  atkSpeed: number;
  moveSpeed: number;
  healPower: number;
  lifesteal: number;
  reflect: number;
  cdr: number; // Cooldown reduction
}

// Experience curve: 100 at level 1, increases exponentially
export const xpToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

// Calculate final character stats from raw database inputs
export const calculateCharacterStats = (
  charClass: string,
  level: number,
  talentsList: string[],
  passivesList: string[],
  equippedItems: ItemData[]
): CharacterStats => {
  const classConfig = CLASSES[charClass] || CLASSES.WARRIOR;

  // 1. Base Stats + Level Scaling
  let maxHp = classConfig.baseHp + (level - 1) * 12;
  let attackPower = classConfig.baseAtk + (level - 1) * 1.5;
  let defense = classConfig.baseDef + (level - 1) * 1.0;
  let critChance = classConfig.baseCritChance;
  let critMult = classConfig.baseCritMult;
  let atkSpeedPct = 0; // percentage increase from passives/gear/talents
  let moveSpeedPct = 0;
  let healPower = classConfig.baseHealPower + (level - 1) * 1.2;

  let lifesteal = 0;
  let reflect = 0;
  let cdr = 0;

  // 2. Add Passive Skill Tree allocations
  for (const nodeKey of passivesList) {
    const node = PASSIVE_SKILL_TREE[nodeKey];
    if (!node) continue;

    if (node.stats.maxHp) maxHp += node.stats.maxHp;
    if (node.stats.attackPower) attackPower += node.stats.attackPower;
    if (node.stats.defense) defense += node.stats.defense;
    if (node.stats.critChance) critChance += node.stats.critChance;
    if (node.stats.atkSpeedPct) atkSpeedPct += node.stats.atkSpeedPct;
  }

  // 3. Add Gear Stats
  for (const item of equippedItems) {
    // Add base stats
    attackPower += item.baseAttack;
    defense += item.baseDefense;

    // Add affixes
    for (const affix of item.affixes) {
      switch (affix.type) {
        case 'maxHp':
          maxHp += affix.value;
          break;
        case 'attackPower':
          attackPower += affix.value;
          break;
        case 'defense':
          defense += affix.value;
          break;
        case 'critChance':
          critChance += affix.value;
          break;
        case 'atkSpeedPct':
          atkSpeedPct += affix.value;
          break;
        case 'moveSpeedPct':
          moveSpeedPct += affix.value;
          break;
        case 'lifesteal':
          lifesteal += affix.value;
          break;
        case 'reflect':
          reflect += affix.value;
          break;
        case 'cdr':
          cdr += affix.value;
          break;
      }
    }
  }

  // 4. Add Talent modifiers (class-specific multipliers and additions)
  let hpMult = 1.0;
  let atkMult = 1.0;
  let defMult = 1.0;

  const classTalents = TALENTS[charClass] || {};
  for (const talentId of talentsList) {
    const talent = classTalents[talentId];
    if (!talent) continue;

    const e = talent.effects;
    if (e.maxHpPct) hpMult += e.maxHpPct;
    if (e.armorPct) defMult += e.armorPct;
    if (e.defensePct) defMult += e.defensePct;
    if (e.lifesteal) lifesteal += e.lifesteal;
    if (e.reflect) reflect += e.reflect;
    if (e.critChance) critChance += e.critChance;
    if (e.critMultPct) critMult += e.critMultPct;
    if (e.moveSpeedPct) moveSpeedPct += e.moveSpeedPct;
    if (e.atkSpeedPct) atkSpeedPct += e.atkSpeedPct;
    if (e.cdr) cdr += e.cdr;
  }

  // Apply final multipliers
  maxHp = Math.round(maxHp * hpMult);
  attackPower = Math.round(attackPower * atkMult);
  defense = Math.round(defense * defMult);

  const finalAtkSpeed = Math.round(classConfig.baseAtkSpeed * (1 + atkSpeedPct) * 100) / 100;
  const finalMoveSpeed = Math.round(classConfig.baseMoveSpeed * (1 + moveSpeedPct));

  return {
    maxHp: Math.max(1, maxHp),
    attackPower: Math.max(1, attackPower),
    defense: Math.max(0, defense),
    critChance: Math.round(Math.min(1.0, critChance) * 100) / 100,
    critMult: Math.round(critMult * 100) / 100,
    atkSpeed: finalAtkSpeed,
    moveSpeed: finalMoveSpeed,
    healPower: Math.round(healPower),
    lifesteal: Math.round(lifesteal * 100) / 100,
    reflect: Math.round(reflect * 100) / 100,
    cdr: Math.round(Math.min(0.75, cdr) * 100) / 100 // Cap CDR at 75%
  };
};

// Item naming database
const ITEM_NAMES = {
  WEAPON: {
    WARRIOR: ['Broadsword', 'Gladius', 'Battleaxe', 'Warhammer', 'Iron Mace'],
    MAGE: ['Spellstaff', 'Rune Wand', 'Crystalline Staff', 'Codex', 'Grimoire'],
    CLERIC: ['Mace of Light', 'Scepter', 'Holy Flail', 'Crook', 'Wand of Grace'],
    ROGUE: ['Dagger', 'Stiletto', 'Dirk', 'Katar', 'Scimitar'],
    RANGER: ['Longbow', 'Shortbow', 'Recurve Bow', 'Crossbow', 'Flatbow']
  },
  ARMOR: ['Plate Mail', 'Leather Tunic', 'Cloth Robes', 'Chainmail', 'Brigandine'],
  ACCESSORY: ['Runic Ring', 'Jade Amulet', 'Charmed Necklace', 'Iron Band', 'Gemstone Band']
};

const LEGENDARY_EFFECTS = [
  { id: 'leg_double_strike', name: 'Double Strike', text: '30% chance on hit to strike a second time.' },
  { id: 'leg_poison_crit', name: 'Toxic Touch', text: 'Critical hits inject venom dealing 100% attack damage over 3s.' },
  { id: 'leg_undying_shield', name: 'Aegis Ward', text: 'Gain a shield equal to 30% Max Life for 5s when hit below 30% health (30s CD).' },
  { id: 'leg_nova_on_hit', name: 'Flame Burst', text: '15% chance when hit to release a fire wave dealing 120% magic damage.' },
  { id: 'leg_lifesteal_surge', name: 'Vampiric Pact', text: '+15% Lifesteal when below 50% health.' },
  { id: 'leg_projectile_split', name: 'Multishot', text: 'Projectiles have a 50% chance to split, hitting an extra target.' },
  { id: 'leg_heal_aoe', name: 'Divine Breath', text: 'Heals are 25% stronger and cure slow/chill.' }
];

export const generateRandomItem = (
  itemLevel: number,
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY',
  slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY',
  charClass?: string
): ItemData => {
  let name = '';
  if (slot === 'WEAPON') {
    const list = ITEM_NAMES.WEAPON[charClass as keyof typeof ITEM_NAMES.WEAPON] || ITEM_NAMES.WEAPON.WARRIOR;
    name = list[Math.floor(Math.random() * list.length)];
  } else if (slot === 'ARMOR') {
    name = ITEM_NAMES.ARMOR[Math.floor(Math.random() * ITEM_NAMES.ARMOR.length)];
  } else {
    name = ITEM_NAMES.ACCESSORY[Math.floor(Math.random() * ITEM_NAMES.ACCESSORY.length)];
  }

  // Base values scale with level
  let baseAttack = 0;
  let baseDefense = 0;

  if (slot === 'WEAPON') {
    baseAttack = Math.round(5 + itemLevel * 2.2);
  } else if (slot === 'ARMOR') {
    baseDefense = Math.round(3 + itemLevel * 1.5);
  } else {
    baseAttack = Math.round(itemLevel * 0.6);
    baseDefense = Math.round(itemLevel * 0.4);
  }

  // Affixes count based on rarity
  let affixCount = 0;
  switch (rarity) {
    case 'UNCOMMON': affixCount = 1; break;
    case 'RARE': affixCount = 2; break;
    case 'EPIC': affixCount = 3; break;
    case 'LEGENDARY': affixCount = 4; break;
  }

  // Generate unique affixes
  const affixPool = [
    { type: 'maxHp', weight: 1.0, min: 4, max: 12 },
    { type: 'attackPower', weight: 1.0, min: 0.8, max: 2.2 },
    { type: 'defense', weight: 1.0, min: 0.6, max: 1.8 },
    { type: 'critChance', weight: 0.8, min: 0.01, max: 0.035 },
    { type: 'atkSpeedPct', weight: 0.8, min: 0.02, max: 0.06 },
    { type: 'moveSpeedPct', weight: 0.6, min: 0.02, max: 0.05 },
    { type: 'lifesteal', weight: 0.5, min: 0.01, max: 0.03 },
    { type: 'reflect', weight: 0.5, min: 0.01, max: 0.03 },
    { type: 'cdr', weight: 0.5, min: 0.02, max: 0.05 }
  ];

  const affixes: Array<{ type: string; value: number }> = [];
  const selectedTypes = new Set<string>();

  while (affixes.length < affixCount && selectedTypes.size < affixPool.length) {
    const affixOpt = affixPool[Math.floor(Math.random() * affixPool.length)];
    if (selectedTypes.has(affixOpt.type)) continue;

    selectedTypes.add(affixOpt.type);
    const minVal = affixOpt.min * (1 + itemLevel * 0.1);
    const maxVal = affixOpt.max * (1 + itemLevel * 0.15);
    let rolledVal = minVal + Math.random() * (maxVal - minVal);

    // Format decimals appropriately
    if (affixOpt.type === 'critChance' || affixOpt.type === 'atkSpeedPct' || affixOpt.type === 'moveSpeedPct' || affixOpt.type === 'lifesteal' || affixOpt.type === 'reflect' || affixOpt.type === 'cdr') {
      rolledVal = Math.round(rolledVal * 1000) / 1000;
    } else {
      rolledVal = Math.round(rolledVal);
    }

    affixes.push({ type: affixOpt.type, value: rolledVal });
  }

  // If Legendary, add unique legendary affix info to the names or descriptions
  if (rarity === 'LEGENDARY') {
    const legEffect = LEGENDARY_EFFECTS[Math.floor(Math.random() * LEGENDARY_EFFECTS.length)];
    name = `Legendary ${name}`;
    affixes.push({ type: `legendary_${legEffect.id}`, value: 1.0 }); // Value 1 indicates active
  } else {
    name = `${rarity.charAt(0) + rarity.slice(1).toLowerCase()} ${name}`;
  }

  return {
    name,
    slot,
    rarity,
    itemLevel,
    baseAttack,
    baseDefense,
    affixes,
    isEquipped: false
  };
};

export const getLegendaryDescription = (affixType: string): string => {
  if (!affixType.startsWith('legendary_')) return '';
  const id = affixType.replace('legendary_', '');
  const effect = LEGENDARY_EFFECTS.find(e => e.id === id);
  return effect ? `${effect.name}: ${effect.text}` : '';
};
