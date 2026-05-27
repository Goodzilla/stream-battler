import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachedUserRepository } from '../CachedUserRepository';
import { CachedCharacterRepository } from '../CachedCharacterRepository';
import { CachedItemRepository } from '../CachedItemRepository';
import { MemoryCache } from '../../../cache/MemoryCache';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { ICharacterRepository } from '../../interfaces/ICharacterRepository';
import { IItemRepository } from '../../interfaces/IItemRepository';

describe('Cached Repositories Wrapper', () => {
  let cache: MemoryCache;
  let mockUserRepo: any;
  let mockCharRepo: any;
  let mockItemRepo: any;

  let cachedUserRepo: CachedUserRepository;
  let cachedCharRepo: CachedCharacterRepository;
  let cachedItemRepo: CachedItemRepository;

  const mockUser: any = {
    id: 'user_1',
    twitchId: 'twitch_1',
    username: 'PlayerOne',
    gold: 100,
    characters: [],
    items: []
  };

  beforeEach(() => {
    cache = new MemoryCache();

    mockUserRepo = {
      findById: vi.fn().mockResolvedValue(mockUser),
      findByTwitchId: vi.fn().mockResolvedValue(mockUser),
      findByUsername: vi.fn().mockResolvedValue(mockUser),
      create: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn().mockResolvedValue(mockUser),
      count: vi.fn().mockResolvedValue(1)
    };

    mockCharRepo = {
      findById: vi.fn().mockResolvedValue({ id: 'char_1', userId: 'user_1', level: 1 }),
      findByUserAndClass: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'char_1', userId: 'user_1' }),
      update: vi.fn().mockResolvedValue({ id: 'char_1', userId: 'user_1', level: 2 }),
      findRankings: vi.fn().mockResolvedValue([{ id: 'char_1', level: 2 }])
    };

    mockItemRepo = {
      findById: vi.fn().mockResolvedValue({ id: 'item_1', userId: 'user_1' }),
      create: vi.fn().mockResolvedValue({ id: 'item_1', userId: 'user_1' }),
      createMany: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 'item_1', userId: 'user_1' }),
      delete: vi.fn().mockResolvedValue({ id: 'item_1', userId: 'user_1' }),
      deleteMany: vi.fn(),
      deleteEquippedByCharacter: vi.fn(),
      countUnequippedByUserId: vi.fn()
    };

    cachedUserRepo = new CachedUserRepository(mockUserRepo, cache);
    cachedCharRepo = new CachedCharacterRepository(mockCharRepo, cache);
    cachedItemRepo = new CachedItemRepository(mockItemRepo, cache);
  });

  describe('CachedUserRepository', () => {
    it('should call findById delegate only once and retrieve from cache on subsequent calls', async () => {
      const u1 = await cachedUserRepo.findById('user_1');
      const u2 = await cachedUserRepo.findById('user_1');

      expect(u1).toEqual(mockUser);
      expect(u2).toEqual(mockUser);
      expect(mockUserRepo.findById).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on user update', async () => {
      await cachedUserRepo.findById('user_1');
      expect(mockUserRepo.findById).toHaveBeenCalledTimes(1);

      // Perform update
      await cachedUserRepo.update('user_1', { gold: 200 });

      // Next read should trigger findById delegate again
      await cachedUserRepo.findById('user_1');
      expect(mockUserRepo.findById).toHaveBeenCalledTimes(2);
    });
  });

  describe('CachedCharacterRepository', () => {
    it('should invalidate user profile cache when character is created', async () => {
      // Load user into cache
      await cachedUserRepo.findById('user_1');
      expect(cache.getUser('user_1', 'id')).not.toBeNull();

      // Create character
      await cachedCharRepo.create({
        userId: 'user_1',
        class: 'WARRIOR',
        level: 1,
        xp: 0,
        talents: '[]',
        passives: '["start"]'
      });

      // User profile cache should be evicted
      expect(cache.getUser('user_1', 'id')).toBeNull();
    });

    it('should invalidate user profile cache when character is updated', async () => {
      // Load user into cache
      await cachedUserRepo.findById('user_1');
      expect(cache.getUser('user_1', 'id')).not.toBeNull();

      // Update character
      await cachedCharRepo.update('char_1', { level: 2 });

      // User profile cache should be evicted
      expect(cache.getUser('user_1', 'id')).toBeNull();
    });

    it('should cache rankings and clear them on write', async () => {
      const r1 = await cachedCharRepo.findRankings('WARRIOR');
      const r2 = await cachedCharRepo.findRankings('WARRIOR');

      expect(r1).toEqual(r2);
      expect(mockCharRepo.findRankings).toHaveBeenCalledTimes(1);

      // Trigger update
      await cachedCharRepo.update('char_1', { level: 3 });

      // Rankings cache should be empty, next read will delegate
      await cachedCharRepo.findRankings('WARRIOR');
      expect(mockCharRepo.findRankings).toHaveBeenCalledTimes(2);
    });
  });

  describe('CachedItemRepository', () => {
    it('should invalidate user profile cache when item is created, updated, or deleted', async () => {
      // Create test
      await cachedUserRepo.findById('user_1');
      expect(cache.getUser('user_1', 'id')).not.toBeNull();
      await cachedItemRepo.create({
        userId: 'user_1',
        name: 'Sword',
        slot: 'WEAPON',
        rarity: 'COMMON',
        itemLevel: 1,
        baseAttack: 5,
        baseDefense: 0,
        affixes: '[]',
        isEquipped: false
      });
      expect(cache.getUser('user_1', 'id')).toBeNull();

      // Update test
      await cachedUserRepo.findById('user_1');
      expect(cache.getUser('user_1', 'id')).not.toBeNull();
      await cachedItemRepo.update('item_1', { isEquipped: true });
      expect(cache.getUser('user_1', 'id')).toBeNull();

      // Delete test
      await cachedUserRepo.findById('user_1');
      expect(cache.getUser('user_1', 'id')).not.toBeNull();
      await cachedItemRepo.delete('item_1');
      expect(cache.getUser('user_1', 'id')).toBeNull();
    });
  });
});
