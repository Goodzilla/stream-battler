import { prisma } from '../../db';
import { IUserRepository, UserWithRelations } from '../interfaces/IUserRepository';
import { User } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { characters: true, items: true }
    });
  }

  async findByTwitchId(twitchId: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { twitchId },
      include: { characters: true, items: true }
    });
  }

  async findByUsername(username: string): Promise<UserWithRelations | null> {
    return prisma.user.findFirst({
      where: { username },
      include: { characters: true, items: true }
    });
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
    return prisma.user.create({
      data,
      include: { characters: true, items: true }
    });
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<UserWithRelations> {
    return prisma.user.update({
      where: { id },
      data,
      include: { characters: true, items: true }
    });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }
}
