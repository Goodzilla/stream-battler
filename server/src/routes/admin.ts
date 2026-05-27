import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT } from './auth';
import { generateRandomItem, xpToNextLevel } from '../game/formulas';

export const adminRouter = Router();

// Protect all admin routes with JWT verification and admin validation
adminRouter.use(authenticateJWT);

const requireAdmin = (req: Request, res: Response, next: () => void) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Access denied: Admin permissions required' });
    return;
  }
  next();
};

adminRouter.use(requireAdmin);

// ADMIN: GRANT XP
adminRouter.post('/grant-xp', async (req: Request, res: Response) => {
  const { xpAmount } = req.body;
  const xp = parseInt(xpAmount);

  if (isNaN(xp) || xp <= 0) {
    res.status(400).json({ error: 'Invalid XP amount' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    let newXp = character.xp + xp;
    let newLevel = character.level;
    let xpNeeded = xpToNextLevel(newLevel);

    while (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      xpNeeded = xpToNextLevel(newLevel);
    }

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        level: newLevel,
        xp: newXp
      },
      include: { items: true, user: true }
    });

    res.json({ character: updated, leveledUp: newLevel > character.level });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: GRANT GOLD
adminRouter.post('/grant-gold', async (req: Request, res: Response) => {
  const { goldAmount } = req.body;
  const gold = parseInt(goldAmount);

  if (isNaN(gold)) {
    res.status(400).json({ error: 'Invalid Gold amount' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        gold: Math.max(0, character.gold + gold)
      },
      include: { items: true, user: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: SPAWN SPECIFIC ITEM
adminRouter.post('/spawn-item', async (req: Request, res: Response) => {
  const { slot, rarity, itemLevel } = req.body;

  const validSlots = ['WEAPON', 'ARMOR', 'ACCESSORY'];
  const validRarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  const level = parseInt(itemLevel);

  if (!validSlots.includes(slot?.toUpperCase()) || !validRarities.includes(rarity?.toUpperCase()) || isNaN(level) || level <= 0) {
    res.status(400).json({ error: 'Invalid parameters. Need slot, rarity, and numeric itemLevel > 0.' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    // Generate random item using ARPG formulas (supports LEGENDARY!)
    const itemData = generateRandomItem(level, rarity.toUpperCase() as any, slot.toUpperCase() as any, character.class);

    const createdItem = await prisma.item.create({
      data: {
        characterId: character.id,
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

    res.json(createdItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: RESET CHARACTER
adminRouter.post('/reset-character', async (req: Request, res: Response) => {
  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    // Wipe items
    await prisma.item.deleteMany({
      where: { characterId: character.id }
    });

    const weaponName = 
      character.class === 'WARRIOR' ? 'Rusty Gladius' :
      character.class === 'MAGE' ? 'Initiate Wand' :
      character.class === 'CLERIC' ? 'Novice Scepter' :
      character.class === 'ROGUE' ? 'Serrated Dirk' : 'Trimming Bow';

    const armorName =
      character.class === 'WARRIOR' ? 'Tattered Mail' :
      character.class === 'MAGE' ? 'Apprentice Robe' :
      character.class === 'CLERIC' ? 'Acolyte Vestment' :
      character.class === 'ROGUE' ? 'Scout Leather' : 'Scout Leather';

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        level: 1,
        xp: 0,
        gold: 100,
        talents: '[]',
        passives: '["start"]',
        items: {
          create: [
            {
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
              name: armorName,
              slot: 'ARMOR',
              rarity: 'COMMON',
              itemLevel: 1,
              baseAttack: 0,
              baseDefense: 3,
              affixes: '[]',
              isEquipped: true
            }
          ]
        }
      },
      include: { items: true, user: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: PROMOTE ANOTHER USER
adminRouter.post('/promote-user', async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  try {
    const userToPromote = await prisma.user.findFirst({
      where: {
        username: username.trim().toLowerCase()
      }
    });

    if (!userToPromote) {
      res.status(404).json({ error: `User with username ${username} not found.` });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userToPromote.id },
      data: { isAdmin: true }
    });

    res.json({ success: true, message: `Successfully promoted ${updatedUser.displayName} to Admin.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
