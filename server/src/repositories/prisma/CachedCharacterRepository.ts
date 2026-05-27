import { ICharacterRepository, CharacterWithUserAndItems } from '../interfaces/ICharacterRepository';
import { Character } from '@prisma/client';
import { MemoryCache } from '../../cache/MemoryCache';

export class CachedCharacterRepository implements ICharacterRepository {
  constructor(
    private delegate: ICharacterRepository,
    private cache: MemoryCache
  ) {}

  async findById(id: string): Promise<Character | null> {
    return this.delegate.findById(id);
  }

  async findByUserAndClass(userId: string, className: string): Promise<Character | null> {
    return this.delegate.findByUserAndClass(userId, className);
  }

  async create(data: {
    userId: string;
    class: string;
    level: number;
    xp: number;
    talents: string;
    passives: string;
  }): Promise<Character> {
    this.cache.invalidateUser(data.userId);
    this.cache.clearLeaderboard();
    return this.delegate.create(data);
  }

  async update(
    id: string,
    data: Partial<Omit<Character, 'id' | 'userId' | 'class' | 'createdAt' | 'updatedAt'>>
  ): Promise<Character> {
    const char = await this.delegate.findById(id);
    if (char) {
      this.cache.invalidateUser(char.userId);
    }
    // Also clear the leaderboard when level or xp changes
    this.cache.clearLeaderboard();
    return this.delegate.update(id, data);
  }

  async findRankings(className?: string): Promise<CharacterWithUserAndItems[]> {
    const cached = this.cache.getLeaderboard(className);
    if (cached) return cached;

    const rankings = await this.delegate.findRankings(className);
    this.cache.setLeaderboard(className, rankings);
    return rankings;
  }
}
