import { IUserRepository, UserWithRelations } from '../interfaces/IUserRepository';
import { User } from '@prisma/client';
import { MemoryCache } from '../../cache/MemoryCache';

export class CachedUserRepository implements IUserRepository {
  constructor(
    private delegate: IUserRepository,
    private cache: MemoryCache
  ) {}

  async findById(id: string): Promise<UserWithRelations | null> {
    const cached = this.cache.getUser(id, 'id');
    if (cached) return cached;

    const user = await this.delegate.findById(id);
    if (user) {
      this.cache.setUser(user);
    }
    return user;
  }

  async findByTwitchId(twitchId: string): Promise<UserWithRelations | null> {
    const cached = this.cache.getUser(twitchId, 'twitchId');
    if (cached) return cached;

    const user = await this.delegate.findByTwitchId(twitchId);
    if (user) {
      this.cache.setUser(user);
    }
    return user;
  }

  async findByUsername(username: string): Promise<UserWithRelations | null> {
    const cached = this.cache.getUser(username, 'username');
    if (cached) return cached;

    const user = await this.delegate.findByUsername(username);
    if (user) {
      this.cache.setUser(user);
    }
    return user;
  }

  async create(data: {
    twitchId: string;
    username: string;
    displayName: string;
    isAdmin: boolean;
    gold: number;
    activeClass: string;
    characters?: {
      create: {
        class: string;
        level: number;
        xp: number;
        talents: string;
        passives: string;
      };
    };
  }): Promise<UserWithRelations> {
    const user = await this.delegate.create(data);
    // Evict just in case there is any stale setup
    this.cache.invalidateUser(user.id);
    return user;
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<UserWithRelations> {
    this.cache.invalidateUser(id);
    const user = await this.delegate.update(id, data);
    return user;
  }

  async count(): Promise<number> {
    return this.delegate.count();
  }
}
