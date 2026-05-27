import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { ICharacterRepository } from '../repositories/interfaces/ICharacterRepository';
import { IItemRepository } from '../repositories/interfaces/IItemRepository';
import { getActiveCharacter, generateShopStock } from '../utils/characterHelper';
import { validatePassiveAllocation, xpToNextLevel, generateRandomItem } from 'shared';
import { BadRequestError, NotFoundError } from '../errors/AppError';

const CLASS_UNLOCK_REQUIREMENTS: Record<string, string> = {
  VALKYRIE: 'WARRIOR',
  NECROMANCER: 'MAGE',
  MONK: 'CLERIC',
  ALCHEMIST: 'ROGUE',
  BARD: 'RANGER'
};

const VALID_CLASSES = [
  'WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER',
  'VALKYRIE', 'NECROMANCER', 'MONK', 'ALCHEMIST', 'BARD'
];

export class CharacterService {
  constructor(
    private userRepository: IUserRepository,
    private characterRepository: ICharacterRepository,
    private itemRepository: IItemRepository
  ) {}

  async getActiveCharacterPayload(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return getActiveCharacter(user);
  }

  async selectClass(userId: string, charClass: string): Promise<any> {
    const selectedClassUpper = charClass.toUpperCase();

    if (!VALID_CLASSES.includes(selectedClassUpper)) {
      throw new BadRequestError(`Invalid class. Must be one of: ${VALID_CLASSES.join(', ')}`);
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    // Lock verification for advanced classes
    const requiredBaseClass = CLASS_UNLOCK_REQUIREMENTS[selectedClassUpper];
    if (requiredBaseClass) {
      const baseChar = user.characters.find(c => c.class === requiredBaseClass);
      if (!baseChar || baseChar.level < 100) {
        throw new BadRequestError(`Advanced class ${selectedClassUpper} is locked. You must reach level 100 with a ${requiredBaseClass} first.`);
      }
    }

    // Check if class character already exists in DB
    let character = await this.characterRepository.findByUserAndClass(userId, selectedClassUpper);

    if (!character) {
      // Starter items for new class
      const weaponName = 
        selectedClassUpper === 'WARRIOR' ? 'Rusty Gladius' :
        selectedClassUpper === 'MAGE' ? 'Initiate Wand' :
        selectedClassUpper === 'CLERIC' ? 'Novice Scepter' :
        selectedClassUpper === 'ROGUE' ? 'Serrated Dirk' :
        selectedClassUpper === 'RANGER' ? 'Trimming Bow' :
        selectedClassUpper === 'VALKYRIE' ? 'Novice Spear' :
        selectedClassUpper === 'NECROMANCER' ? 'Apprentice Scythe' :
        selectedClassUpper === 'MONK' ? 'Worn Fist Wraps' :
        selectedClassUpper === 'ALCHEMIST' ? 'Crude Flask' : 'Tuned Lute';

      const armorName =
        selectedClassUpper === 'WARRIOR' ? 'Tattered Mail' :
        selectedClassUpper === 'MAGE' ? 'Apprentice Robe' :
        selectedClassUpper === 'CLERIC' ? 'Acolyte Vestment' :
        selectedClassUpper === 'ROGUE' ? 'Scout Leather' :
        selectedClassUpper === 'RANGER' ? 'Scout Leather' :
        selectedClassUpper === 'VALKYRIE' ? 'Valkyrie Plate' :
        selectedClassUpper === 'NECROMANCER' ? 'Dark Robe' :
        selectedClassUpper === 'MONK' ? 'Monk Gi' :
        selectedClassUpper === 'ALCHEMIST' ? 'Alchemist Coat' : 'Bard Garb';

      character = await this.characterRepository.create({
        userId,
        class: selectedClassUpper,
        level: 1,
        xp: 0,
        talents: '[]',
        passives: '["start"]'
      });

      // Create starter items in User backpack and equip them to this character
      await this.itemRepository.createMany([
        {
          userId,
          equippedCharacterId: character.id,
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
          equippedCharacterId: character.id,
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
    }

    // Set activeClass on User
    const updatedUser = await this.userRepository.update(userId, {
      activeClass: selectedClassUpper
    });

    return getActiveCharacter(updatedUser);
  }

  async allocatePassives(userId: string, passives: string[]): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('No active character profile');
    }

    const maxAllocatable = 1 + Math.min(50, Math.floor(activeChar.level / 2));
    if (passives.length > maxAllocatable) {
      throw new BadRequestError(`Insufficient skill points. Allocated: ${passives.length - 1}, Max: ${maxAllocatable - 1}`);
    }

    if (!validatePassiveAllocation(passives)) {
      throw new BadRequestError('Invalid passive tree layout: allocated nodes must be contiguous and start at origin');
    }

    await this.characterRepository.update(activeChar.id, {
      passives: JSON.stringify(passives)
    });

    const updatedUser = await this.userRepository.findById(userId);
    return getActiveCharacter(updatedUser);
  }

  async selectTalents(userId: string, talents: string[]): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('No active character profile');
    }

    const maxTier = Math.floor(activeChar.level / 10);
    const validTalents: string[] = [];
    const chosenTiers = new Set<number>();

    for (const talentId of talents) {
      const match = talentId.match(/^t(\d+)_\d+$/);
      if (!match) continue;

      const tier = parseInt(match[1], 10);

      if (tier > maxTier) {
        throw new BadRequestError(`Talent tier ${tier} requires Level ${tier * 10}. Current level: ${activeChar.level}`);
      }

      if (chosenTiers.has(tier)) {
        throw new BadRequestError(`Cannot select multiple talents in tier ${tier}`);
      }

      chosenTiers.add(tier);
      validTalents.push(talentId);
    }

    await this.characterRepository.update(activeChar.id, {
      talents: JSON.stringify(validTalents)
    });

    const updatedUser = await this.userRepository.findById(userId);
    return getActiveCharacter(updatedUser);
  }

  async reportSoloBattle(
    userId: string,
    battleData: { xpGained: number; goldGained: number; countOfKills?: number; mapLevel: number; won: boolean }
  ): Promise<any> {
    const { xpGained, goldGained, countOfKills, mapLevel, won } = battleData;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('No active character profile');
    }

    // Cheat protection
    const limitFactor = countOfKills ? Math.min(countOfKills, 30) : 10;
    const maxCredibleXp = mapLevel * 100 * limitFactor;
    const maxCredibleGold = mapLevel * 10 * limitFactor;

    if (xpGained > maxCredibleXp || goldGained > maxCredibleGold) {
      throw new BadRequestError('Cheat protection: rewards reported exceed limits');
    }

    // 1. Update XP on active character
    let newXp = activeChar.xp + xpGained;
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

    // 2. Update Gold and generate new shop Stock on User
    const newGold = user.gold + goldGained;
    const newShopStock = generateShopStock(newLevel, activeChar.class);

    // 3. Roll random loot items (linked directly to User stash)
    const unequippedCount = await this.itemRepository.countUnequippedByUserId(userId);

    let inventoryFull = false;
    const lootCreated = [];
    
    if (won) {
      if (unequippedCount >= 30) {
        inventoryFull = true;
      } else {
        // 15% chance of 1 loot drop
        if (Math.random() < 0.15) {
          const rarRoll = Math.random();
          let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' = 'COMMON';

          if (mapLevel >= 10) {
            if (rarRoll < 0.02) rarity = 'EPIC';
            else if (rarRoll < 0.10) rarity = 'RARE';
            else if (rarRoll < 0.35) rarity = 'UNCOMMON';
          } else if (mapLevel >= 5) {
            if (rarRoll < 0.05) rarity = 'RARE';
            else if (rarRoll < 0.25) rarity = 'UNCOMMON';
          } else {
            if (rarRoll < 0.10) rarity = 'UNCOMMON';
          }

          const slots: Array<'WEAPON' | 'ARMOR' | 'ACCESSORY'> = ['WEAPON', 'ARMOR', 'ACCESSORY'];
          const slot = slots[Math.floor(Math.random() * slots.length)];

          const itemRaw = generateRandomItem(newLevel, rarity, slot, activeChar.class);
          lootCreated.push(itemRaw);
        }
      }
    }

    // Save active character changes
    await this.characterRepository.update(activeChar.id, {
      level: newLevel,
      xp: newXp
    });

    // Save user changes (gold, shop stock)
    if (lootCreated.length > 0) {
      await this.itemRepository.createMany(
        lootCreated.map(item => ({
          userId,
          name: item.name,
          slot: item.slot,
          rarity: item.rarity,
          itemLevel: item.itemLevel,
          baseAttack: item.baseAttack,
          baseDefense: item.baseDefense,
          affixes: JSON.stringify(item.affixes),
          isEquipped: false
        }))
      );
    }

    const updatedUser = await this.userRepository.update(userId, {
      gold: newGold,
      shopStock: newShopStock
    });

    const formattedChar = getActiveCharacter(updatedUser);

    return {
      character: formattedChar,
      gainedXp: xpGained,
      gainedGold: goldGained,
      leveledUp: newLevel > activeChar.level,
      droppedItems: updatedUser.items.slice(updatedUser.items.length - lootCreated.length),
      inventoryFull
    };
  }

  async getLeaderboard(charClass?: string): Promise<any[]> {
    const leaders = await this.characterRepository.findRankings(charClass);

    return leaders
      .filter((char) => {
        const username = (char.user?.username || '').toLowerCase();
        return !username.includes('test') && !username.startsWith('admin_');
      })
      .slice(0, 20)
      .map((char, index) => {
        const weapon = char.equippedItems.find((i: any) => i.slot === 'WEAPON');
        const armor = char.equippedItems.find((i: any) => i.slot === 'ARMOR');
        const accessory = char.equippedItems.find((i: any) => i.slot === 'ACCESSORY');

        return {
          rank: index + 1,
          characterId: char.id,
          displayName: char.user.displayName,
          username: char.user.username,
          class: char.class,
          level: char.level,
          xp: char.xp,
          gold: char.user.gold,
          equipped: {
            weapon: weapon ? { name: weapon.name, rarity: weapon.rarity } : null,
            armor: armor ? { name: armor.name, rarity: armor.rarity } : null,
            accessory: accessory ? { name: accessory.name, rarity: accessory.rarity } : null
          }
        };
      });
  }
}

