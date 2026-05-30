import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { ICharacterRepository } from '../repositories/interfaces/ICharacterRepository';
import { IItemRepository } from '../repositories/interfaces/IItemRepository';
import { getActiveCharacter } from '../utils/characterHelper';
import { generateRandomItem, xpToNextLevel } from 'shared';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export class AdminService {
  constructor(
    private userRepository: IUserRepository,
    private characterRepository: ICharacterRepository,
    private itemRepository: IItemRepository
  ) {}

  async grantXp(
    userId: string,
    xp: number,
    targetUsername?: string
  ): Promise<{ character: any; leveledUp: boolean; targetIsSelf: boolean; message: string }> {
    let targetUser: any;
    if (targetUsername && targetUsername.trim()) {
      targetUser = await this.userRepository.findByUsername(targetUsername.trim().toLowerCase());
      if (!targetUser) {
        throw new NotFoundError(`Target user '${targetUsername}' not found.`);
      }
    } else {
      targetUser = await this.userRepository.findById(userId);
      if (!targetUser) {
        throw new NotFoundError('Active user not found');
      }
    }

    const activeClass = targetUser.activeClass || 'WARRIOR';
    const activeChar = targetUser.characters.find((c: any) => c.class === activeClass);
    if (!activeChar) {
      throw new NotFoundError(`Active character for user '${targetUser.username}' not found.`);
    }

    let newXp = activeChar.xp + xp;
    let newLevel = activeChar.level;
    let xpNeeded = xpToNextLevel(newLevel);

    while (newXp >= xpNeeded && newLevel < 100) {
      newXp -= xpNeeded;
      newLevel += 1;
      xpNeeded = xpToNextLevel(newLevel);
    }
    if (newLevel >= 100) {
      newLevel = 100;
      newXp = 0;
    }

    await this.characterRepository.update(activeChar.id, {
      level: newLevel,
      xp: newXp
    });

    const updatedUser = await this.userRepository.findById(targetUser.id);
    const targetIsSelf = targetUser.id === userId;

    return {
      character: getActiveCharacter(updatedUser),
      leveledUp: newLevel > activeChar.level,
      targetIsSelf,
      message: `Granted ${xp} XP to ${targetUser.displayName}. (Level ${newLevel})`
    };
  }

  async grantGold(
    userId: string,
    gold: number,
    targetUsername?: string
  ): Promise<{ character: any; gold: number; targetIsSelf: boolean; message: string }> {
    let targetUser: any;
    if (targetUsername && targetUsername.trim()) {
      targetUser = await this.userRepository.findByUsername(targetUsername.trim().toLowerCase());
      if (!targetUser) {
        throw new NotFoundError(`Target user '${targetUsername}' not found.`);
      }
    } else {
      targetUser = await this.userRepository.findById(userId);
      if (!targetUser) {
        throw new NotFoundError('Active user not found');
      }
    }

    const updatedUser = await this.userRepository.update(targetUser.id, {
      gold: Math.max(0, targetUser.gold + gold)
    });

    const targetIsSelf = targetUser.id === userId;

    return {
      character: getActiveCharacter(updatedUser),
      gold: updatedUser.gold,
      targetIsSelf,
      message: `Granted ${gold} Gold to ${updatedUser.displayName}.`
    };
  }

  async spawnItem(userId: string, slot: string, rarity: string, itemLevel: number): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('Active character not found');
    }

    const itemData = generateRandomItem(itemLevel, rarity.toUpperCase() as any, slot.toUpperCase() as any, activeChar.class);

    const createdItem = await this.itemRepository.create({
      userId,
      name: itemData.name,
      slot: itemData.slot,
      rarity: itemData.rarity,
      itemLevel: itemData.itemLevel,
      baseAttack: itemData.baseAttack,
      baseDefense: itemData.baseDefense,
      affixes: JSON.stringify(itemData.affixes),
      isEquipped: false
    });

    return createdItem;
  }

  async resetCharacter(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('Active character not found');
    }

    // Wipe items equipped specifically by this character
    await this.itemRepository.deleteEquippedByCharacter(userId, activeChar.id);

    const weaponName = 
      activeChar.class === 'WARRIOR' ? 'Rusty Gladius' :
      activeChar.class === 'MAGE' ? 'Initiate Wand' :
      activeChar.class === 'CLERIC' ? 'Novice Scepter' :
      activeChar.class === 'ROGUE' ? 'Serrated Dirk' : 'Trimming Bow';

    const armorName =
      activeChar.class === 'WARRIOR' ? 'Tattered Mail' :
      activeChar.class === 'MAGE' ? 'Apprentice Robe' :
      activeChar.class === 'CLERIC' ? 'Acolyte Vestment' :
      activeChar.class === 'ROGUE' ? 'Scout Leather' : 'Scout Leather';

    await this.characterRepository.update(activeChar.id, {
      level: 1,
      xp: 0,
      talents: '[]',
      passives: '["start"]'
    });

    await this.itemRepository.createMany([
      {
        userId,
        equippedCharacterId: activeChar.id,
        name: weaponName,
        slot: 'WEAPON',
        rarity: 'COMMON',
        itemLevel: 1,
        baseAttack: 5,
        baseDefense: 0,
        affixes: '[]',
        isEquipped: true
      },
      {
        userId,
        equippedCharacterId: activeChar.id,
        name: armorName,
        slot: 'ARMOR',
        rarity: 'COMMON',
        itemLevel: 1,
        baseAttack: 0,
        baseDefense: 3,
        affixes: '[]',
        isEquipped: true
      }
    ]);

    const updatedUser = await this.userRepository.findById(userId);
    return getActiveCharacter(updatedUser);
  }

  async promoteUser(username: string): Promise<{ message: string; userId: string }> {
    const userToPromote = await this.userRepository.findByUsername(username.trim().toLowerCase());
    if (!userToPromote) {
      throw new NotFoundError(`User with username ${username} not found.`);
    }

    const updatedUser = await this.userRepository.update(userToPromote.id, {
      isAdmin: true
    });

    return {
      message: `Successfully promoted ${updatedUser.displayName} to Admin.`,
      userId: updatedUser.id
    };
  }

  async unlockAllClasses(userId: string): Promise<any> {
    const baseClasses = ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'];
    
    for (const bClass of baseClasses) {
      const character = await this.characterRepository.findByUserAndClass(userId, bClass);

      if (!character) {
        const weaponName = 
          bClass === 'WARRIOR' ? 'Rusty Gladius' :
          bClass === 'MAGE' ? 'Initiate Wand' :
          bClass === 'CLERIC' ? 'Novice Scepter' :
          bClass === 'ROGUE' ? 'Serrated Dirk' : 'Trimming Bow';

        const armorName =
          bClass === 'WARRIOR' ? 'Tattered Mail' :
          bClass === 'MAGE' ? 'Apprentice Robe' :
          bClass === 'CLERIC' ? 'Acolyte Vestment' :
          bClass === 'ROGUE' ? 'Scout Leather' : 'Scout Leather';

        const createdChar = await this.characterRepository.create({
          userId,
          class: bClass,
          level: 100,
          xp: 0,
          talents: '[]',
          passives: '["start"]'
        });

        await this.itemRepository.createMany([
          {
            userId,
            equippedCharacterId: createdChar.id,
            name: weaponName,
            slot: 'WEAPON',
            rarity: 'COMMON',
            itemLevel: 1,
            baseAttack: 5,
            baseDefense: 0,
            affixes: '[]',
            isEquipped: true
          },
          {
            userId,
            equippedCharacterId: createdChar.id,
            name: armorName,
            slot: 'ARMOR',
            rarity: 'COMMON',
            itemLevel: 1,
            baseAttack: 0,
            baseDefense: 3,
            affixes: '[]',
            isEquipped: true
          }
        ]);
      } else {
        await this.characterRepository.update(character.id, {
          level: 100
        });
      }
    }

    const updatedUser = await this.userRepository.findById(userId);
    return getActiveCharacter(updatedUser);
  }
}
