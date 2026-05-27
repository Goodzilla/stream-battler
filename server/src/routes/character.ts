import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT, getActiveCharacter } from './auth';
import { validatePassiveAllocation } from '../game/constants';
import { xpToNextLevel, generateRandomItem } from '../game/formulas';

export const characterRouter = Router();

// Apply auth middleware to all character endpoints
characterRouter.use(authenticateJWT);

// Helper to generate 3 random items for the merchant stock
export const generateShopStock = (charLevel: number, charClass: string) => {
  const slots = ['WEAPON', 'ARMOR', 'ACCESSORY'] as const;
  const items = [];
  for (let i = 0; i < 3; i++) {
    const slot = slots[i];
    const rRoll = Math.random();
    let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' = 'COMMON';
    if (rRoll < 0.03) rarity = 'EPIC';
    else if (rRoll < 0.20) rarity = 'RARE';
    else if (rRoll < 0.60) rarity = 'UNCOMMON';

    items.push({
      id: `shop_temp_${Math.random().toString(36).substr(2, 9)}`,
      ...generateRandomItem(charLevel, rarity, slot, charClass)
    });
  }
  return JSON.stringify(items);
};

// GET CURRENT CHARACTER PROFILE
characterRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { characters: true, items: true }
    });
    res.json(getActiveCharacter(user));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// INITIALIZE OR SWAP CHARACTER CLASS (No wiping of previous class progress)
characterRouter.post('/select-class', async (req: Request, res: Response) => {
  const { charClass } = req.body;
  const validClasses = ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'];

  if (!charClass || !validClasses.includes(charClass.toUpperCase())) {
    res.status(400).json({ error: `Invalid class. Must be one of: ${validClasses.join(', ')}` });
    return;
  }

  const selectedClassUpper = charClass.toUpperCase();

  try {
    // Check if class character already exists in DB
    let character = await prisma.character.findUnique({
      where: {
        userId_class: {
          userId: req.user!.id,
          class: selectedClassUpper
        }
      }
    });

    if (!character) {
      // Starter items for new class
      const weaponName = 
        selectedClassUpper === 'WARRIOR' ? 'Rusty Gladius' :
        selectedClassUpper === 'MAGE' ? 'Initiate Wand' :
        selectedClassUpper === 'CLERIC' ? 'Novice Scepter' :
        selectedClassUpper === 'ROGUE' ? 'Serrated Dirk' : 'Trimming Bow';

      const armorName =
        selectedClassUpper === 'WARRIOR' ? 'Tattered Mail' :
        selectedClassUpper === 'MAGE' ? 'Apprentice Robe' :
        selectedClassUpper === 'CLERIC' ? 'Acolyte Vestment' :
        selectedClassUpper === 'ROGUE' ? 'Scout Leather' : 'Scout Leather';

      character = await prisma.character.create({
        data: {
          userId: req.user!.id,
          class: selectedClassUpper,
          level: 1,
          xp: 0,
          talents: '[]',
          passives: '["start"]'
        }
      });

      // Create starter items in User backpack and equip them to this character
      await prisma.item.createMany({
        data: [
          {
            userId: req.user!.id,
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
            userId: req.user!.id,
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
        ]
      });
    }

    // Set activeClass on User
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        activeClass: selectedClassUpper
      }
    });

    // Refetch full User structure
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { characters: true, items: true }
    });

    res.json(getActiveCharacter(updatedUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ALLOCATE PASSIVE SKILL NODES
characterRouter.post('/allocate-passives', async (req: Request, res: Response) => {
  const { passives } = req.body;

  if (!Array.isArray(passives)) {
    res.status(400).json({ error: 'Passives must be an array of node IDs' });
    return;
  }

  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'No active character' });
    return;
  }

  try {
    const maxAllocatable = activeChar.level;
    if (passives.length > maxAllocatable) {
      res.status(400).json({ error: `Insufficient skill points. Allocated: ${passives.length}, Max: ${maxAllocatable}` });
      return;
    }

    if (!validatePassiveAllocation(passives)) {
      res.status(400).json({ error: 'Invalid passive tree layout: allocated nodes must be contiguous and start at origin' });
      return;
    }

    await prisma.character.update({
      where: { id: activeChar.id },
      data: {
        passives: JSON.stringify(passives)
      }
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

// SELECT TALENTS
characterRouter.post('/select-talents', async (req: Request, res: Response) => {
  const { talents } = req.body;

  if (!Array.isArray(talents)) {
    res.status(400).json({ error: 'Talents must be an array of strings' });
    return;
  }

  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'No active character' });
    return;
  }

  try {
    const maxTier = Math.floor(activeChar.level / 5);
    const validTalents: string[] = [];
    const chosenTiers = new Set<number>();

    for (const talentId of talents) {
      const match = talentId.match(/^t([1-4])_\d+$/);
      if (!match) continue;

      const tier = parseInt(match[1]);

      if (tier > maxTier) {
        res.status(400).json({ error: `Talent tier ${tier} requires Level ${tier * 5}. Current level: ${activeChar.level}` });
        return;
      }

      if (chosenTiers.has(tier)) {
        res.status(400).json({ error: `Cannot select multiple talents in tier ${tier}` });
        return;
      }

      chosenTiers.add(tier);
      validTalents.push(talentId);
    }

    await prisma.character.update({
      where: { id: activeChar.id },
      data: {
        talents: JSON.stringify(validTalents)
      }
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

// REPORT BATTLE COMPLETION (SOLO GRINDING) - Updates gold on User and auto-refreshes shop
characterRouter.post('/report-solo-battle', async (req: Request, res: Response) => {
  const { xpGained, goldGained, countOfKills, mapLevel } = req.body;

  if (xpGained === undefined || goldGained === undefined) {
    res.status(400).json({ error: 'Missing xpGained or goldGained inputs' });
    return;
  }

  const activeChar = req.user!.character;
  if (!activeChar) {
    res.status(404).json({ error: 'No active character' });
    return;
  }

  try {
    const limitFactor = countOfKills ? Math.min(countOfKills, 30) : 10;
    const maxCredibleXp = mapLevel * 100 * limitFactor;
    const maxCredibleGold = mapLevel * 50 * limitFactor;

    if (xpGained > maxCredibleXp || goldGained > maxCredibleGold) {
      res.status(400).json({ error: 'Cheat protection: rewards reported exceed limits' });
      return;
    }

    // 1. Update XP on active character
    let newXp = activeChar.xp + xpGained;
    let newLevel = activeChar.level;
    let xpNeeded = xpToNextLevel(newLevel);

    while (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      xpNeeded = xpToNextLevel(newLevel);
    }

    // 2. Update Gold and generate new shop Stock on User
    const newGold = req.user!.gold + goldGained;
    const newShopStock = generateShopStock(newLevel, activeChar.class);

    // 3. Roll random loot items (linked directly to User stash)
    const lootCreated = [];
    const rollCount = Math.random() < 0.3 ? (Math.random() < 0.2 ? 2 : 1) : 0;

    for (let i = 0; i < rollCount; i++) {
      const rarRoll = Math.random();
      let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' = 'COMMON';
      if (rarRoll < 0.05) rarity = 'EPIC';
      else if (rarRoll < 0.15) rarity = 'RARE';
      else if (rarRoll < 0.40) rarity = 'UNCOMMON';

      const slots: Array<'WEAPON' | 'ARMOR' | 'ACCESSORY'> = ['WEAPON', 'ARMOR', 'ACCESSORY'];
      const slot = slots[Math.floor(Math.random() * slots.length)];

      const itemRaw = generateRandomItem(newLevel, rarity, slot, activeChar.class);
      lootCreated.push(itemRaw);
    }

    // Save active character changes
    await prisma.character.update({
      where: { id: activeChar.id },
      data: {
        level: newLevel,
        xp: newXp
      }
    });

    // Save user changes (gold, shop stock, and create stash items)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        gold: newGold,
        shopStock: newShopStock,
        items: {
          create: lootCreated.map(item => ({
            name: item.name,
            slot: item.slot,
            rarity: item.rarity,
            itemLevel: item.itemLevel,
            baseAttack: item.baseAttack,
            baseDefense: item.baseDefense,
            affixes: JSON.stringify(item.affixes),
            isEquipped: false
          }))
        }
      }
    });

    // Refetch full User structure
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { characters: true, items: true }
    }) as any;

    const formattedChar = getActiveCharacter(updatedUser);

    res.json({
      character: formattedChar,
      gainedXp: xpGained,
      gainedGold: goldGained,
      leveledUp: newLevel > activeChar.level,
      droppedItems: updatedUser.items.slice(updatedUser.items.length - lootCreated.length)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
