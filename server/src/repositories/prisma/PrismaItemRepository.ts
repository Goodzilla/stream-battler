import { prisma } from '../../db';
import { IItemRepository } from '../interfaces/IItemRepository';
import { Item } from '@prisma/client';

export class PrismaItemRepository implements IItemRepository {
  async findById(id: string): Promise<Item | null> {
    return prisma.item.findUnique({
      where: { id }
    });
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
    return prisma.item.create({
      data
    });
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
    await prisma.item.createMany({
      data: items
    });
  }

  async update(id: string, data: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<Item> {
    return prisma.item.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Item> {
    return prisma.item.delete({
      where: { id }
    });
  }

  async deleteMany(ids: string[]): Promise<void> {
    await prisma.item.deleteMany({
      where: {
        id: { in: ids }
      }
    });
  }

  async deleteEquippedByCharacter(userId: string, characterId: string): Promise<void> {
    await prisma.item.deleteMany({
      where: {
        userId,
        equippedCharacterId: characterId
      }
    });
  }

  async countUnequippedByUserId(userId: string): Promise<number> {
    return prisma.item.count({
      where: {
        userId,
        isEquipped: false
      }
    });
  }
}
