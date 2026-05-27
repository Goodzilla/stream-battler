import { describe, it, expect } from 'vitest';
import { xpToNextLevel, calculateCharacterStats, generateRandomItem, validatePassiveAllocation } from 'shared';
import { getDistance, getDirection, seek } from '../physics';

describe('XP Curve', () => {
  it('should scale exponentially', () => {
    expect(xpToNextLevel(1)).toBe(100);
    expect(xpToNextLevel(5)).toBe(Math.floor(100 * Math.pow(5, 1.5)));
    expect(xpToNextLevel(20)).toBe(Math.floor(100 * Math.pow(20, 1.5)));
  });
});

describe('Passive Tree Validator', () => {
  it('should pass for contiguous start path', () => {
    expect(validatePassiveAllocation([])).toBe(true);
    expect(validatePassiveAllocation(['start'])).toBe(true);
    expect(validatePassiveAllocation(['start', 'r1_0'])).toBe(true);
    expect(validatePassiveAllocation(['start', 'r1_0', 'r2_0'])).toBe(true);
  });

  it('should fail if missing start node', () => {
    expect(validatePassiveAllocation(['r1_0'])).toBe(false);
  });

  it('should fail if path is broken/unconnected', () => {
    expect(validatePassiveAllocation(['start', 'r2_0'])).toBe(false);
  });
});

describe('Character Stats Calculator', () => {
  it('should compute warrior level 1 stats', () => {
    const stats = calculateCharacterStats('WARRIOR', 1, [], ['start'], []);
    expect(stats.maxHp).toBe(190); // 180 base + 10 start node
    expect(stats.attackPower).toBe(18); // 16 base + 2 start node
  });

  it('should apply gear modifiers', () => {
    const weapon = {
      name: 'Gladius',
      slot: 'WEAPON' as const,
      rarity: 'COMMON' as const,
      itemLevel: 10,
      baseAttack: 27,
      baseDefense: 0,
      affixes: [{ type: 'critChance', value: 0.05 }],
      isEquipped: true
    };

    const stats = calculateCharacterStats('WARRIOR', 1, [], ['start'], [weapon]);
    expect(stats.attackPower).toBe(45); // 16 base + 2 node + 27 weapon
    expect(stats.critChance).toBe(0.10); // 0.05 base + 0.05 weapon
  });

  it('should parse and apply stringified gear affixes', () => {
    const armor = {
      name: 'Plate Mail',
      slot: 'ARMOR' as const,
      rarity: 'RARE' as const,
      itemLevel: 20,
      baseAttack: 0,
      baseDefense: 33,
      affixes: JSON.stringify([{ type: 'maxHp', value: 15 }, { type: 'fireRes', value: 0.12 }]) as any,
      isEquipped: true
    };

    const stats = calculateCharacterStats('WARRIOR', 1, [], ['start'], [armor]);
    expect(stats.maxHp).toBe(205); // 180 base + 10 start node + 15 armor
    expect(stats.fireRes).toBe(0.12);
  });

  it('should apply talent flat/percentage effects', () => {
    // Aegis Shield (t4_2) warrior talent: increases reflect by 15%
    const stats = calculateCharacterStats('WARRIOR', 5, ['t4_2'], ['start'], []);
    expect(stats.reflect).toBe(0.15);
  });
});

describe('ARPG Loot Generator', () => {
  it('should generate items with correct affixes count based on rarity', () => {
    const common = generateRandomItem(10, 'COMMON', 'WEAPON', 'WARRIOR');
    expect(common.affixes.length).toBe(0);

    const uncommon = generateRandomItem(10, 'UNCOMMON', 'ARMOR', 'MAGE');
    expect(uncommon.affixes.length).toBe(1);

    const epic = generateRandomItem(15, 'EPIC', 'ACCESSORY', 'ROGUE');
    expect(epic.affixes.length).toBe(3);

    const legendary = generateRandomItem(20, 'LEGENDARY', 'WEAPON', 'RANGER');
    expect(legendary.affixes.length).toBe(4);
    expect(legendary.name.startsWith('Legendary')).toBe(true);
    expect(legendary.affixes.some(a => a.type.startsWith('legendary_'))).toBe(false);
  });
});

describe('Vector Physics Math', () => {
  it('should compute distance', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('should compute direction', () => {
    const dir = getDirection({ x: 10, y: 20 }, { x: 20, y: 20 });
    expect(dir.x).toBe(1);
    expect(dir.y).toBe(0);
  });

  it('should seek target', () => {
    const nextPos = seek({ x: 0, y: 0 }, { x: 100, y: 0 }, 50, 1); // speed 50, dt 1
    expect(nextPos.x).toBe(50);
    expect(nextPos.y).toBe(0);
  });
});

describe('Resistances and Affix Restrictions', () => {
  it('should not allow weapons to roll resistances', () => {
    // Generate many legendary weapons and verify none have resistance affixes
    for (let i = 0; i < 20; i++) {
      const weapon = generateRandomItem(50, 'LEGENDARY', 'WEAPON', 'WARRIOR');
      const resAffixes = weapon.affixes.filter(a => ['fireRes', 'coldRes', 'poisonRes', 'physRes'].includes(a.type));
      expect(resAffixes.length).toBe(0);
    }
  });

  it('should allow armor and accessories to roll resistances with correct scaling', () => {
    // Generate many legendary armors/accessories and check scaling limits
    for (let i = 0; i < 20; i++) {
      const armor = generateRandomItem(100, 'LEGENDARY', 'ARMOR', 'WARRIOR');
      for (const affix of armor.affixes) {
        if (['fireRes', 'coldRes', 'poisonRes', 'physRes'].includes(affix.type)) {
          expect(affix.value).toBeLessThanOrEqual(0.75);
          expect(affix.value).toBeGreaterThanOrEqual(0.02);
        }
      }
    }
  });

  it('should cap character resistances at 75%', () => {
    const highResArmor = {
      name: 'Plate of Fire Immersion',
      slot: 'ARMOR' as const,
      rarity: 'LEGENDARY' as const,
      itemLevel: 100,
      baseAttack: 0,
      baseDefense: 50,
      affixes: [
        { type: 'fireRes', value: 0.60 },
        { type: 'coldRes', value: 0.85 } // Over capped
      ],
      isEquipped: true
    };

    const highResRing = {
      name: 'Ring of Flame',
      slot: 'ACCESSORY' as const,
      rarity: 'RARE' as const,
      itemLevel: 100,
      baseAttack: 0,
      baseDefense: 5,
      affixes: [
        { type: 'fireRes', value: 0.35 } // Together 0.95
      ],
      isEquipped: true
    };

    const stats = calculateCharacterStats('WARRIOR', 1, [], ['start'], [highResArmor, highResRing]);
    expect(stats.fireRes).toBe(0.75); // Capped at 75%
    expect(stats.coldRes).toBe(0.75); // Capped at 75%
  });
});

