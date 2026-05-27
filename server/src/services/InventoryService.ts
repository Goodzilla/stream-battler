import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { ICharacterRepository } from '../repositories/interfaces/ICharacterRepository';
import { IItemRepository } from '../repositories/interfaces/IItemRepository';
import { getActiveCharacter } from '../utils/characterHelper';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export class InventoryService {
  constructor(
    private userRepository: IUserRepository,
    private characterRepository: ICharacterRepository,
    private itemRepository: IItemRepository
  ) {}

  async equipItem(userId: string, itemId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('No active character profile');
    }

    const itemToEquip = await this.itemRepository.findById(itemId);
    if (!itemToEquip || itemToEquip.userId !== userId) {
      throw new NotFoundError('Item not found in your stash');
    }

    if (itemToEquip.itemLevel > activeChar.level) {
      throw new BadRequestError(`Requires character level ${itemToEquip.itemLevel} to equip this item.`);
    }

    const slot = itemToEquip.slot;

    // Unequip currently equipped item in the same slot for this specific character
    const currentlyEquipped = user.items.find(
      (item) => item.equippedCharacterId === activeChar.id && item.slot === slot && item.isEquipped
    );

    if (currentlyEquipped) {
      await this.itemRepository.update(currentlyEquipped.id, {
        isEquipped: false,
        equippedCharacterId: null
      });
    }

    // Equip the new item
    await this.itemRepository.update(itemId, {
      isEquipped: true,
      equippedCharacterId: activeChar.id
    });

    const updatedUser = await this.userRepository.findById(userId);
    return getActiveCharacter(updatedUser);
  }

  async unequipItem(userId: string, itemId: string): Promise<any> {
    const itemToUnequip = await this.itemRepository.findById(itemId);
    if (!itemToUnequip || itemToUnequip.userId !== userId) {
      throw new NotFoundError('Item not found in stash');
    }

    await this.itemRepository.update(itemId, {
      isEquipped: false,
      equippedCharacterId: null
    });

    const updatedUser = await this.userRepository.findById(userId);
    return getActiveCharacter(updatedUser);
  }

  async dismantleItem(userId: string, itemId: string): Promise<{ character: any; goldGained: number }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const item = await this.itemRepository.findById(itemId);
    if (!item || item.userId !== userId) {
      throw new NotFoundError('Item not found in user stash');
    }

    if (item.isEquipped) {
      throw new BadRequestError('Cannot sell an equipped item. Unequip it first.');
    }

    // Determine gold reward based on level and rarity
    let baseGold = item.itemLevel * 3;
    switch (item.rarity) {
      case 'UNCOMMON': baseGold += 8; break;
      case 'RARE': baseGold += 20; break;
      case 'EPIC': baseGold += 60; break;
      case 'LEGENDARY': baseGold += 200; break;
    }

    // Delete item
    await this.itemRepository.delete(itemId);

    // Add gold to user profile
    const updatedUser = await this.userRepository.update(userId, {
      gold: user.gold + baseGold
    });

    return {
      character: getActiveCharacter(updatedUser),
      goldGained: baseGold
    };
  }

  async dismantleAll(userId: string): Promise<{ character: any; goldGained: number }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const unequippedItems = user.items.filter((item) => !item.isEquipped);

    if (unequippedItems.length === 0) {
      return {
        character: getActiveCharacter(user),
        goldGained: 0
      };
    }

    let totalGoldGained = 0;
    const itemIdsToDelete = [];

    for (const item of unequippedItems) {
      let baseGold = item.itemLevel * 3;
      switch (item.rarity) {
        case 'UNCOMMON': baseGold += 8; break;
        case 'RARE': baseGold += 20; break;
        case 'EPIC': baseGold += 60; break;
        case 'LEGENDARY': baseGold += 200; break;
      }
      totalGoldGained += baseGold;
      itemIdsToDelete.push(item.id);
    }

    // Delete all these items
    await this.itemRepository.deleteMany(itemIdsToDelete);

    // Update user gold
    const updatedUser = await this.userRepository.update(userId, {
      gold: user.gold + totalGoldGained
    });

    return {
      character: getActiveCharacter(updatedUser),
      goldGained: totalGoldGained
    };
  }
}
