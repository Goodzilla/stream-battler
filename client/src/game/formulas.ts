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
  cdr: number;
}

export const xpToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

export const calculateCharacterStats = (
  charClass: string,
  level: number,
  talentsList: string[],
  passivesList: string[],
  equippedItems: ItemData[]
): CharacterStats => {
  const classConfig = CLASSES[charClass] || CLASSES.WARRIOR;

  let maxHp = classConfig.baseHp + (level - 1) * 12;
  let attackPower = classConfig.baseAtk + (level - 1) * 1.5;
  let defense = classConfig.baseDef + (level - 1) * 1.0;
  let critChance = classConfig.baseCritChance;
  let critMult = classConfig.baseCritMult;
  let atkSpeedPct = 0;
  let moveSpeedPct = 0;
  let healPower = classConfig.baseHealPower + (level - 1) * 1.2;

  let lifesteal = 0;
  let reflect = 0;
  let cdr = 0;

  for (const nodeKey of passivesList) {
    const node = PASSIVE_SKILL_TREE[nodeKey];
    if (!node) continue;

    if (node.stats.maxHp) maxHp += node.stats.maxHp;
    if (node.stats.attackPower) attackPower += node.stats.attackPower;
    if (node.stats.defense) defense += node.stats.defense;
    if (node.stats.critChance) critChance += node.stats.critChance;
    if (node.stats.atkSpeedPct) atkSpeedPct += node.stats.atkSpeedPct;
  }

  for (const item of equippedItems) {
    attackPower += item.baseAttack;
    defense += item.baseDefense;

    for (const affix of item.affixes) {
      switch (affix.type) {
        case 'maxHp': maxHp += affix.value; break;
        case 'attackPower': attackPower += affix.value; break;
        case 'defense': defense += affix.value; break;
        case 'critChance': critChance += affix.value; break;
        case 'atkSpeedPct': atkSpeedPct += affix.value; break;
        case 'moveSpeedPct': moveSpeedPct += affix.value; break;
        case 'lifesteal': lifesteal += affix.value; break;
        case 'reflect': reflect += affix.value; break;
        case 'cdr': cdr += affix.value; break;
      }
    }
  }

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
    cdr: Math.round(Math.min(0.75, cdr) * 100) / 100
  };
};

export const getLegendaryDescription = (affixType: string): string => {
  if (!affixType.startsWith('legendary_')) return '';
  const id = affixType.replace('legendary_', '');
  
  const effects = [
    { id: 'leg_double_strike', name: 'Double Strike', text: '30% chance on hit to strike a second time.' },
    { id: 'leg_poison_crit', name: 'Toxic Touch', text: 'Critical hits inject venom dealing 100% attack damage over 3s.' },
    { id: 'leg_undying_shield', name: 'Aegis Ward', text: 'Gain a shield equal to 30% Max Life for 5s when hit below 30% health (30s CD).' },
    { id: 'leg_nova_on_hit', name: 'Flame Burst', text: '15% chance when hit to release a fire wave dealing 120% magic damage.' },
    { id: 'leg_lifesteal_surge', name: 'Vampiric Pact', text: '+15% Lifesteal when below 50% health.' },
    { id: 'leg_projectile_split', name: 'Multishot', text: 'Projectiles have a 50% chance to split, hitting an extra target.' },
    { id: 'leg_heal_aoe', name: 'Divine Breath', text: 'Heals are 25% stronger and cure slow/chill.' }
  ];
  const effect = effects.find(e => e.id === id);
  return effect ? `${effect.name}: ${effect.text}` : '';
};
