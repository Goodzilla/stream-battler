import { Item } from '@prisma/client';

export interface IItemRepository {
  findById(id: string): Promise<Item | null>;
  create(data: {
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
  }): Promise<Item>;
  createMany(items: Array<{
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
  }>): Promise<void>;
  update(id: string, data: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<Item>;
  delete(id: string): Promise<Item>;
  deleteMany(ids: string[]): Promise<void>;
  deleteEquippedByCharacter(userId: string, characterId: string): Promise<void>;
  countUnequippedByUserId(userId: string): Promise<number>;
}
