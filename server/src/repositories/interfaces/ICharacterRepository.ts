import { Character, Item, User } from '@prisma/client';

export type CharacterWithUserAndItems = Character & {
  user: User;
  equippedItems: Item[];
};

export interface ICharacterRepository {
  findById(id: string): Promise<Character | null>;
  findByUserAndClass(userId: string, className: string): Promise<Character | null>;
  create(data: {
    userId: string;
    class: string;
    level: number;
    xp: number;
    talents: string;
    passives: string;
  }): Promise<Character>;
  update(id: string, data: Partial<Omit<Character, 'id' | 'userId' | 'class' | 'createdAt' | 'updatedAt'>>): Promise<Character>;
  findRankings(className?: string): Promise<CharacterWithUserAndItems[]>;
}
