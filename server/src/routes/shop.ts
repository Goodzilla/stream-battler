import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT, getActiveCharacter } from './auth';
import { generateRandomItem } from '../game/formulas';
import { generateShopStock } from './character';

export const shopRouter = Router();

shopRouter.use(authenticateJWT);

// GET CURRENT SHOP STOCK AND GOLD
shopRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let stock = [];
    try {
      stock = JSON.parse(user.shopStock || '[]');
    } catch {
      stock = [];
    }

    // Initialize stock if empty
    if (stock.length === 0 && req.user!.character) {
      const activeChar = req.user!.character;
      const initializedStockStr = generateShopStock(activeChar.level, activeChar.class);
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { shopStock: initializedStockStr }
      });
      stock = JSON.parse(updatedUser.shopStock);
    }

    res.json({
      gold: user.gold,
      shopStock: stock
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REFRESH SHOP STOCK MANUALLY (Costs 10 Gold)
shopRouter.post('/refresh', async (req: Request, res: Response) => {
  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'Active character profile not found' });
    return;
  }

  if (req.user!.gold < 10) {
    res.status(400).json({ error: 'Insufficient gold. Refreshing costs 10 Gold.' });
    return;
  }

  try {
    const newStockStr = generateShopStock(activeChar.level, activeChar.class);

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        gold: req.user!.gold - 10,
        shopStock: newStockStr
      },
      include: { characters: true, items: true }
    });

    res.json({
      character: getActiveCharacter(updatedUser),
      shopStock: JSON.parse(updatedUser.shopStock)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BUY GEAR ITEM FROM MERCHANT
shopRouter.post('/buy', async (req: Request, res: Response) => {
  const { shopItemId } = req.body;

  if (!shopItemId) {
    res.status(400).json({ error: 'Shop Item ID is required' });
    return;
  }

  let stock = [];
  try {
    stock = JSON.parse(req.user!.shopStock || '[]');
  } catch {
    res.status(400).json({ error: 'Merchant stock is uninitialized' });
    return;
  }

  const shopItem = stock.find((item: any) => item.id === shopItemId);
  if (!shopItem) {
    res.status(404).json({ error: 'Item not found in current shop inventory' });
    return;
  }

  // Calculate price based on item level and rarity
  let price = shopItem.itemLevel * 20;
  switch (shopItem.rarity) {
    case 'UNCOMMON': price += 50; break;
    case 'RARE': price += 150; break;
    case 'EPIC': price += 450; break;
    case 'LEGENDARY': price += 1000; break;
  }

  if (req.user!.gold < price) {
    res.status(400).json({ error: `Insufficient Gold. Purchase requires ${price} Gold.` });
    return;
  }

  try {
    // Remove from shopStock
    const updatedStock = stock.filter((item: any) => item.id !== shopItemId);

    // Create item in DB linked to user ( backpack )
    await prisma.item.create({
      data: {
        userId: req.user!.id,
        name: shopItem.name,
        slot: shopItem.slot,
        rarity: shopItem.rarity,
        itemLevel: shopItem.itemLevel,
        baseAttack: shopItem.baseAttack,
        baseDefense: shopItem.baseDefense,
        affixes: JSON.stringify(shopItem.affixes),
        isEquipped: false
      }
    });

    // Deduct gold and update stock on user
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        gold: req.user!.gold - price,
        shopStock: JSON.stringify(updatedStock)
      },
      include: { characters: true, items: true }
    });

    res.json({
      character: getActiveCharacter(updatedUser),
      shopStock: updatedStock
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GAMBLE / MYSTERY ITEM MERCHANT (Gheed style)
shopRouter.post('/gamble', async (req: Request, res: Response) => {
  const { slot } = req.body; // 'WEAPON' | 'ARMOR' | 'ACCESSORY'
  const validSlots = ['WEAPON', 'ARMOR', 'ACCESSORY'];

  if (!slot || !validSlots.includes(slot.toUpperCase())) {
    res.status(400).json({ error: 'Invalid slot selected. Must be one of: WEAPON, ARMOR, ACCESSORY' });
    return;
  }

  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'Active character profile not found' });
    return;
  }

  // Cost scales with character level: Level * 40 gold
  const price = activeChar.level * 40;

  if (req.user!.gold < price) {
    res.status(400).json({ error: `Insufficient Gold. Gambling requires ${price} Gold.` });
    return;
  }

  try {
    // Roll random rarity: Common 50%, Uncommon 30%, Rare 14%, Epic 5.5%, Legendary 0.5%
    const r = Math.random();
    let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' = 'COMMON';
    
    if (r < 0.005) {
      rarity = 'LEGENDARY';
    } else if (r < 0.06) {
      rarity = 'EPIC';
    } else if (r < 0.20) {
      rarity = 'RARE';
    } else if (r < 0.50) {
      rarity = 'UNCOMMON';
    }

    // Generate random item
    const itemData = generateRandomItem(activeChar.level, rarity, slot.toUpperCase() as any, activeChar.class);

    // Create item in DB backpack
    const createdItem = await prisma.item.create({
      data: {
        userId: req.user!.id,
        name: itemData.name,
        slot: itemData.slot,
        rarity: itemData.rarity,
        itemLevel: itemData.itemLevel,
        baseAttack: itemData.baseAttack,
        baseDefense: itemData.baseDefense,
        affixes: JSON.stringify(itemData.affixes),
        isEquipped: false
      }
    });

    // Deduct gold from user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        gold: req.user!.gold - price
      },
      include: { characters: true, items: true }
    });

    res.json({
      character: getActiveCharacter(updatedUser),
      droppedItem: createdItem
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
