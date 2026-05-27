import { IItemRepository } from '../interfaces/IItemRepository';
import { Item } from '@prisma/client';
import { MemoryCache } from '../../cache/MemoryCache';

export class CachedItemRepository implements IItemRepository {
  constructor(
    private delegate: IItemRepository,
    private cache: MemoryCache
  ) {}

  async findById(id: string): Promise<Item | null> {
    return this.delegate.findById(id);
  }

  async create(data: {
    userId: string;
    equippedCharacterId?: string | null;
    name: string;
    slot: string;
    rarity: string;
    itemLevel: number;
    baseAttack: number;
    baseDefense: number;
    affixes: string;
    isEquipped: boolean;
  }): Promise<Item> {
    this.cache.invalidateUser(data.userId);
    return this.delegate.create(data);
  }

  async createMany(items: Array<{
    userId: string;
    equippedCharacterId?: string | null;
    name: string;
    slot: string;
    rarity: string;
    itemLevel: number;
    baseAttack: number;
    baseDefense: number;
    affixes: string;
    isEquipped: boolean;
  }>): Promise<void> {
    const userIds = new Set<string>();
    for (const item of items) {
      userIds.add(item.userId);
    }
    for (const userId of userIds) {
      this.cache.invalidateUser(userId);
    }
    return this.delegate.createMany(items);
  }

  async update(id: string, data: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<Item> {
    const item = await this.delegate.findById(id);
    if (item) {
      this.cache.invalidateUser(item.userId);
    }
    return this.delegate.update(id, data);
  }

  async delete(id: string): Promise<Item> {
    const item = await this.delegate.findById(id);
    if (item) {
      this.cache.invalidateUser(item.userId);
    }
    return this.delegate.delete(id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const userIds = new Set<string>();
    for (const id of ids) {
      const item = await this.delegate.findById(id);
      if (item) {
        userIds.add(item.userId);
      }
    }
    for (const userId of userIds) {
      this.cache.invalidateUser(userId);
    }
    return this.delegate.deleteMany(ids);
  }

  async deleteEquippedByCharacter(userId: string, characterId: string): Promise<void> {
    this.cache.invalidateUser(userId);
    return this.delegate.deleteEquippedByCharacter(userId, characterId);
  }

  async countUnequippedByUserId(userId: string): Promise<number> {
    return this.delegate.countUnequippedByUserId(userId);
  }
}
