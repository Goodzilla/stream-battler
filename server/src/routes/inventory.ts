import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT, getActiveCharacter } from './auth';

export const inventoryRouter = Router();

inventoryRouter.use(authenticateJWT);

// EQUIP AN ITEM TO ACTIVE CHARACTER
inventoryRouter.post('/equip', async (req: Request, res: Response) => {
  const { itemId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: 'Item ID is required' });
    return;
  }

  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'Active character not found' });
    return;
  }

  try {
    const itemToEquip = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!itemToEquip || itemToEquip.userId !== req.user!.id) {
      res.status(404).json({ error: 'Item not found in user stash' });
      return;
    }

    // Unequip currently equipped item in the same slot for this specific character
    const slot = itemToEquip.slot;
    const equippedInSlot = await prisma.item.findFirst({
      where: {
        userId: req.user!.id,
        equippedCharacterId: activeChar.id,
        slot,
        isEquipped: true
      }
    });

    if (equippedInSlot) {
      await prisma.item.update({
        where: { id: equippedInSlot.id },
        data: { isEquipped: false, equippedCharacterId: null }
      });
    }

    // Equip the new item
    await prisma.item.update({
      where: { id: itemId },
      data: { isEquipped: true, equippedCharacterId: activeChar.id }
    });

    // Refetch full updated user info
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { characters: true, items: true }
    });

    res.json(getActiveCharacter(updatedUser));
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
    const itemToUnequip = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!itemToUnequip || itemToUnequip.userId !== req.user!.id) {
      res.status(404).json({ error: 'Item not found in stash' });
      return;
    }

    await prisma.item.update({
      where: { id: itemId },
      data: { isEquipped: false, equippedCharacterId: null }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { characters: true, items: true }
    });

    res.json(getActiveCharacter(updatedUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DISMANTLE/SELL AN ITEM FOR GOLD
inventoryRouter.post('/dismantle', async (req: Request, res: Response) => {
  const { itemId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: 'Item ID is required' });
    return;
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item || item.userId !== req.user!.id) {
      res.status(404).json({ error: 'Item not found in user stash' });
      return;
    }

    if (item.isEquipped) {
      res.status(400).json({ error: 'Cannot sell an equipped item. Unequip it first.' });
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

    // Add gold to user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        gold: req.user!.gold + baseGold
      },
      include: { characters: true, items: true }
    });

    res.json({
      character: getActiveCharacter(updatedUser),
      goldGained: baseGold
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
