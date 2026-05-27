import { RaidHistory } from '@prisma/client';

export interface IRaidHistoryRepository {
  create(data: {
    streamerName: string;
    bossName: string;
    bossLevel: number;
    participants: number;
    success: boolean;
  }): Promise<RaidHistory>;
}
