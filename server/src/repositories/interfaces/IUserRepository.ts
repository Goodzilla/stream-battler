import { User, Character, Item } from '@prisma/client';

export type UserWithRelations = User & {
  characters: Character[];
  items: Item[];
};

export interface IUserRepository {
  findById(id: string): Promise<UserWithRelations | null>;
  findByTwitchId(twitchId: string): Promise<UserWithRelations | null>;
  findByUsername(username: string): Promise<UserWithRelations | null>;
  create(data: {
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
  }): Promise<UserWithRelations>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<UserWithRelations>;
  count(): Promise<number>;
}
