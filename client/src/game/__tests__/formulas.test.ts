import { describe, it, expect } from 'vitest';
import { calculateCharacterStats } from '../formulas';

describe('Client Character Stats', () => {
  it('should calculate base Warrior stats on the client', () => {
    const stats = calculateCharacterStats('WARRIOR', 1, [], ['start'], []);
    expect(stats.maxHp).toBe(190);
    expect(stats.attackPower).toBe(18);
  });
});
