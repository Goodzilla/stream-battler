import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT } from './auth';

export const inventoryRouter = Router();

inventoryRouter.use(authenticateJWT);

// EQUIP AN ITEM
inventoryRouter.post('/equip', async (req: Request, res: Response) => {
  const { itemId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: 'Item ID is required' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id },
      include: { items: true, user: true }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const itemToEquip = character.items.find(item => item.id === itemId);
    if (!itemToEquip) {
      res.status(404).json({ error: 'Item not found in character inventory' });
      return;
    }

    // Unequip currently equipped item in the same slot
    const slot = itemToEquip.slot;
    const equippedInSlot = character.items.find(item => item.slot === slot && item.isEquipped);

    if (equippedInSlot) {
      await prisma.item.update({
        where: { id: equippedInSlot.id },
        data: { isEquipped: false }
      });
    }

    // Equip the new item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: { isEquipped: true }
    });

    // Fetch full updated character info to return
    const updatedChar = await prisma.character.findUnique({
      where: { id: character.id },
      include: { items: true, user: true }
    });

    res.json(updatedChar);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UNEQUIP AN ITEM
inventoryRouter.post('/unequip', async (req: Request, res: Response) => {
  const { itemId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: 'Item ID is required' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id },
      include: { items: true, user: true }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const itemToUnequip = character.items.find(item => item.id === itemId);
    if (!itemToUnequip) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    await prisma.item.update({
      where: { id: itemId },
      data: { isEquipped: false }
    });

    const updatedChar = await prisma.character.findUnique({
      where: { id: character.id },
      include: { items: true, user: true }
    });

    res.json(updatedChar);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DISMANTLE AN ITEM FOR GOLD
inventoryRouter.post('/dismantle', async (req: Request, res: Response) => {
  const { itemId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: 'Item ID is required' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id },
      include: { items: true, user: true }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const item = character.items.find(item => item.id === itemId);
    if (!item) {
      res.status(404).json({ error: 'Item not found in character inventory' });
      return;
    }

    if (item.isEquipped) {
      res.status(400).json({ error: 'Cannot dismantle an equipped item. Unequip it first.' });
      return;
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
    await prisma.item.delete({
      where: { id: itemId }
    });

    // Add gold to character
    const updatedChar = await prisma.character.update({
      where: { id: character.id },
      data: {
        gold: character.gold + baseGold
      },
      include: { items: true, user: true }
    });

    res.json({
      character: updatedChar,
      goldGained: baseGold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
