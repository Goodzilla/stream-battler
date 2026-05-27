import { prisma } from '../../db';
import { IRaidHistoryRepository } from '../interfaces/IRaidHistoryRepository';
import { RaidHistory } from '@prisma/client';

export class PrismaRaidHistoryRepository implements IRaidHistoryRepository {
  async create(data: {
    streamerName: string;
    bossName: string;
    bossLevel: number;
    participants: number;
    success: boolean;
  }): Promise<RaidHistory> {
    return prisma.raidHistory.create({
      data
    });
  }
}
