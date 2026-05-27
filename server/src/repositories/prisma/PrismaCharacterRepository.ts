import { prisma } from '../../db';
import { ICharacterRepository, CharacterWithUserAndItems } from '../interfaces/ICharacterRepository';
import { Character } from '@prisma/client';

export class PrismaCharacterRepository implements ICharacterRepository {
  async findById(id: string): Promise<Character | null> {
    return prisma.character.findUnique({
      where: { id }
    });
  }

  async findByUserAndClass(userId: string, className: string): Promise<Character | null> {
    return prisma.character.findUnique({
      where: {
        userId_class: {
          userId,
          class: className
        }
      }
    });
  }

  async create(data: {
    userId: string;
    class: string;
    level: number;
    xp: number;
    talents: string;
    passives: string;
  }): Promise<Character> {
    return prisma.character.create({
      data
    });
  }

  async update(
    id: string,
    data: Partial<Omit<Character, 'id' | 'userId' | 'class' | 'createdAt' | 'updatedAt'>>
  ): Promise<Character> {
    return prisma.character.update({
      where: { id },
      data
    });
  }

  async findRankings(className?: string): Promise<CharacterWithUserAndItems[]> {
    const queryOptions: any = {
      take: 100, // Fetch more to allow for filtering in memory
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' }
      ],
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            gold: true
          }
        },
        equippedItems: true
      }
    };

    if (className) {
      queryOptions.where = {
        class: className
      };
    }

    return prisma.character.findMany(queryOptions) as unknown as CharacterWithUserAndItems[];
  }
}
