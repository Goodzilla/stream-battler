import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryCache } from '../MemoryCache';
import { UserWithRelations } from '../../repositories/interfaces/IUserRepository';

describe('MemoryCache', () => {
  let cache: MemoryCache;
  const mockUser: UserWithRelations = {
    id: 'user_1',
    twitchId: 'twitch_1',
    username: 'PlayerOne',
    displayName: 'Player One',
    isAdmin: false,
    gold: 500,
    activeClass: 'WARRIOR',
    createdAt: new Date(),
    updatedAt: new Date(),
    characters: [],
    items: [],
    shopStock: '[]'
  };

  beforeEach(() => {
    cache = new MemoryCache(100, 50); // Short TTLs for testing: user 100ms, leaderboard 50ms
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve user by id, twitchId, and username', () => {
    cache.setUser(mockUser);

    expect(cache.getUser('user_1', 'id')).toEqual(mockUser);
    expect(cache.getUser('twitch_1', 'twitchId')).toEqual(mockUser);
    expect(cache.getUser('PlayerOne', 'username')).toEqual(mockUser);
    expect(cache.getUser('playerone', 'username')).toEqual(mockUser); // Case insensitivity
  });

  it('should invalidate user by id and clean up all lookup maps', () => {
    cache.setUser(mockUser);
    cache.invalidateUser('user_1');

    expect(cache.getUser('user_1', 'id')).toBeNull();
    expect(cache.getUser('twitch_1', 'twitchId')).toBeNull();
    expect(cache.getUser('PlayerOne', 'username')).toBeNull();
  });

  it('should return null and evict user after TTL expires', () => {
    cache.setUser(mockUser);

    // Fast-forward time past 100ms
    vi.advanceTimersByTime(101);

    expect(cache.getUser('user_1', 'id')).toBeNull();
    expect(cache.getUser('twitch_1', 'twitchId')).toBeNull();
  });

  it('should cache and invalidate leaderboard rankings by class', () => {
    const mockRankings = [{ characterId: 'char_1', displayName: 'Hero' }];
    cache.setLeaderboard('WARRIOR', mockRankings);
    cache.setLeaderboard(undefined, mockRankings); // Default/ALL

    expect(cache.getLeaderboard('WARRIOR')).toEqual(mockRankings);
    expect(cache.getLeaderboard(undefined)).toEqual(mockRankings);

    cache.clearLeaderboard();
    expect(cache.getLeaderboard('WARRIOR')).toBeNull();
    expect(cache.getLeaderboard(undefined)).toBeNull();
  });

  it('should return null and evict leaderboard after TTL expires', () => {
    const mockRankings = [{ characterId: 'char_1', displayName: 'Hero' }];
    cache.setLeaderboard('MAGE', mockRankings);

    // Fast-forward past 50ms
    vi.advanceTimersByTime(51);

    expect(cache.getLeaderboard('MAGE')).toBeNull();
  });
});
