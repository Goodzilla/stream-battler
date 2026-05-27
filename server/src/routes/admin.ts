import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT, getActiveCharacter } from './auth';
import { generateRandomItem, xpToNextLevel } from 'shared';

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

// ADMIN: GRANT XP TO ACTIVE CHARACTER
adminRouter.post('/grant-xp', async (req: Request, res: Response) => {
  const { xpAmount } = req.body;
  const xp = parseInt(xpAmount);

  if (isNaN(xp) || xp <= 0) {
    res.status(400).json({ error: 'Invalid XP amount' });
    return;
  }

  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'Active character not found' });
    return;
  }

  try {
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

    await prisma.character.update({
      where: { id: activeChar.id },
      data: {
        level: newLevel,
        xp: newXp
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { characters: true, items: true }
    });

    res.json({ character: getActiveCharacter(updatedUser), leveledUp: newLevel > activeChar.level });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: GRANT GOLD TO ACCOUNT
adminRouter.post('/grant-gold', async (req: Request, res: Response) => {
  const { goldAmount } = req.body;
  const gold = parseInt(goldAmount);

  if (isNaN(gold)) {
    res.status(400).json({ error: 'Invalid Gold amount' });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        gold: Math.max(0, req.user!.gold + gold)
      },
      include: { characters: true, items: true }
    });

    res.json(getActiveCharacter(updatedUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: SPAWN SPECIFIC ITEM IN BACKPACK
adminRouter.post('/spawn-item', async (req: Request, res: Response) => {
  const { slot, rarity, itemLevel } = req.body;

  const validSlots = ['WEAPON', 'ARMOR', 'ACCESSORY'];
  const validRarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  const level = parseInt(itemLevel);

  if (!validSlots.includes(slot?.toUpperCase()) || !validRarities.includes(rarity?.toUpperCase()) || isNaN(level) || level <= 0) {
    res.status(400).json({ error: 'Invalid parameters. Need slot, rarity, and numeric itemLevel > 0.' });
    return;
  }

  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'Active character not found' });
    return;
  }

  try {
    const itemData = generateRandomItem(level, rarity.toUpperCase() as any, slot.toUpperCase() as any, activeChar.class);

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

    res.json(createdItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: RESET ACTIVE CHARACTER PROGRESS
adminRouter.post('/reset-character', async (req: Request, res: Response) => {
  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'Active character not found' });
    return;
  }

  try {
    // Wipe items equipped specifically by this character
    await prisma.item.deleteMany({
      where: {
        userId: req.user!.id,
        equippedCharacterId: activeChar.id
      }
    });

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

    await prisma.character.update({
      where: { id: activeChar.id },
      data: {
        level: 1,
        xp: 0,
        talents: '[]',
        passives: '["start"]'
      }
    });

    await prisma.item.createMany({
      data: [
        {
          userId: req.user!.id,
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
          userId: req.user!.id,
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
      ]
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
