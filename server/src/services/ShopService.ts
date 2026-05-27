import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { ICharacterRepository } from '../repositories/interfaces/ICharacterRepository';
import { IItemRepository } from '../repositories/interfaces/IItemRepository';
import { getActiveCharacter, generateShopStock } from '../utils/characterHelper';
import { generateRandomItem } from 'shared';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export class ShopService {
  constructor(
    private userRepository: IUserRepository,
    private characterRepository: ICharacterRepository,
    private itemRepository: IItemRepository
  ) {}

  async getShopData(userId: string): Promise<{ gold: number; shopStock: any[] }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    let stock = [];
    try {
      stock = JSON.parse(user.shopStock || '[]');
    } catch {
      stock = [];
    }

    // Initialize stock if empty
    const activeChar = getActiveCharacter(user);
    if (stock.length === 0 && activeChar) {
      const initializedStockStr = generateShopStock(activeChar.level, activeChar.class);
      const updatedUser = await this.userRepository.update(userId, {
        shopStock: initializedStockStr
      });
      stock = JSON.parse(updatedUser.shopStock);
    }

    return {
      gold: user.gold,
      shopStock: stock
    };
  }

  async refreshShop(userId: string): Promise<{ character: any; shopStock: any[] }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('Active character profile not found');
    }

    const price = 10 * activeChar.level;

    if (user.gold < price) {
      throw new BadRequestError(`Insufficient gold. Refreshing costs ${price} Gold.`);
    }

    const newStockStr = generateShopStock(activeChar.level, activeChar.class);

    const updatedUser = await this.userRepository.update(userId, {
      gold: user.gold - price,
      shopStock: newStockStr
    });

    return {
      character: getActiveCharacter(updatedUser),
      shopStock: JSON.parse(updatedUser.shopStock)
    };
  }

  async buyShopItem(userId: string, shopItemId: string): Promise<{ character: any; shopStock: any[] }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    let stock = [];
    try {
      stock = JSON.parse(user.shopStock || '[]');
    } catch {
      throw new BadRequestError('Merchant stock is uninitialized');
    }

    const shopItem = stock.find((item: any) => item.id === shopItemId);
    if (!shopItem) {
      throw new NotFoundError('Item not found in current shop inventory');
    }

    // Calculate price based on item level and rarity
    let price = shopItem.itemLevel * 20;
    switch (shopItem.rarity) {
      case 'UNCOMMON': price += 50; break;
      case 'RARE': price += 150; break;
      case 'EPIC': price += 450; break;
      case 'LEGENDARY': price += 1000; break;
    }

    if (user.gold < price) {
      throw new BadRequestError(`Insufficient Gold. Purchase requires ${price} Gold.`);
    }

    // Remove from shopStock
    const updatedStock = stock.filter((item: any) => item.id !== shopItemId);

    // Create item in DB backpack
    await this.itemRepository.create({
      userId,
      name: shopItem.name,
      slot: shopItem.slot,
      rarity: shopItem.rarity,
      itemLevel: shopItem.itemLevel,
      baseAttack: shopItem.baseAttack,
      baseDefense: shopItem.baseDefense,
      affixes: JSON.stringify(shopItem.affixes),
      isEquipped: false
    });

    // Deduct gold and update stock on user
    const updatedUser = await this.userRepository.update(userId, {
      gold: user.gold - price,
      shopStock: JSON.stringify(updatedStock)
    });

    return {
      character: getActiveCharacter(updatedUser),
      shopStock: updatedStock
    };
  }

  async gambleItem(userId: string, slot: string): Promise<{ character: any; droppedItem: any }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const activeChar = getActiveCharacter(user);
    if (!activeChar) {
      throw new NotFoundError('Active character profile not found');
    }

    const price = activeChar.level * 25 + 200;

    if (user.gold < price) {
      throw new BadRequestError(`Insufficient Gold. Gambling requires ${price} Gold.`);
    }

    // Roll random rarity: Common 9%, Uncommon 30%, Rare 51%, Epic 9%, Legendary 1%
    const r = Math.random();
    let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' = 'COMMON';
    
    if (r < 0.01) {
      rarity = 'LEGENDARY';
    } else if (r < 0.10) {
      rarity = 'EPIC';
    } else if (r < 0.61) {
      rarity = 'RARE';
    } else if (r < 0.91) {
      rarity = 'UNCOMMON';
    }

    // Generate random item
    const itemData = generateRandomItem(activeChar.level, rarity, slot.toUpperCase() as any, activeChar.class);

    // Create item in DB backpack
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

    // Deduct gold from user profile
    const updatedUser = await this.userRepository.update(userId, {
      gold: user.gold - price
    });

    return {
      character: getActiveCharacter(updatedUser),
      droppedItem: createdItem
    };
  }
}
