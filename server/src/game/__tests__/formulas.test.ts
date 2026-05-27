import { describe, it, expect } from 'vitest';
import { xpToNextLevel, calculateCharacterStats, generateRandomItem } from '../formulas';
import { validatePassiveAllocation } from '../constants';
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

  it('should apply talent percentage multipliers', () => {
    // Juggernaut (t1_1) warrior talent: +20% HP, +5% Armor
    const stats = calculateCharacterStats('WARRIOR', 5, ['t1_1'], ['start'], []);
    // baseHp = 180 + 4*12 = 228. node = 10. Total flat = 238.
    // Mult = 1.20. final HP = 238 * 1.2 = 285.6 -> 286
    expect(stats.maxHp).toBe(286);
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
