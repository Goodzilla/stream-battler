import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT } from './auth';
import { validatePassiveAllocation } from '../game/constants';
import { xpToNextLevel, generateRandomItem } from '../game/formulas';

export const characterRouter = Router();

// Apply auth middleware to all character endpoints
characterRouter.use(authenticateJWT);

// GET CURRENT CHARACTER PROFILE (already included in /me, but good for standalone fetches)
characterRouter.get('/', async (req: Request, res: Response) => {
  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id },
      include: { items: true, user: true }
    });
    res.json(character);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// INITIALIZE OR CHANGE CHARACTER CLASS (Resets progress)
characterRouter.post('/select-class', async (req: Request, res: Response) => {
  const { charClass } = req.body;
  const validClasses = ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'];

  if (!charClass || !validClasses.includes(charClass.toUpperCase())) {
    res.status(400).json({ error: `Invalid class. Must be one of: ${validClasses.join(', ')}` });
    return;
  }

  try {
    // Delete all current items
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id }
    });

    if (character) {
      await prisma.item.deleteMany({
        where: { characterId: character.id }
      });
    }

    // Starting items based on class
    const weaponName = 
      charClass === 'WARRIOR' ? 'Rusty Gladius' :
      charClass === 'MAGE' ? 'Initiate Wand' :
      charClass === 'CLERIC' ? 'Novice Scepter' :
      charClass === 'ROGUE' ? 'Serrated Dirk' : 'Trimming Bow';

    const armorName =
      charClass === 'WARRIOR' ? 'Tattered Mail' :
      charClass === 'MAGE' ? 'Apprentice Robe' :
      charClass === 'CLERIC' ? 'Acolyte Vestment' :
      charClass === 'ROGUE' ? 'Scout Leather' : 'Scout Leather';

    const updatedChar = await prisma.character.update({
      where: { userId: req.user!.id },
      data: {
        class: charClass.toUpperCase(),
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

    res.json(updatedChar);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ALLOCATE PASSIVE SKILL NODES
characterRouter.post('/allocate-passives', async (req: Request, res: Response) => {
  const { passives } = req.body; // Array of node string IDs e.g. ["start", "r1_0", "r2_0"]

  if (!Array.isArray(passives)) {
    res.status(400).json({ error: 'Passives must be an array of node IDs' });
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

    // Max skill points = level (starts with 1 point at level 1 to allocate "start", plus 1 per level up)
    const maxAllocatable = character.level; // "start" node counts as 1
    if (passives.length > maxAllocatable) {
      res.status(400).json({ error: `Insufficient skill points. Allocated: ${passives.length}, Max: ${maxAllocatable}` });
      return;
    }

    // Validate tree connectivity
    if (!validatePassiveAllocation(passives)) {
      res.status(400).json({ error: 'Invalid passive tree layout: allocated nodes must be contiguous and start at origin' });
      return;
    }

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        passives: JSON.stringify(passives)
      },
      include: { items: true, user: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SELECT TALENTS
characterRouter.post('/select-talents', async (req: Request, res: Response) => {
  const { talents } = req.body; // Array of talent IDs e.g., ["t1_1", "t2_2"]

  if (!Array.isArray(talents)) {
    res.status(400).json({ error: 'Talents must be an array of strings' });
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

    // Validate tier level requirements
    // t1 requires level 5, t2 level 10, t3 level 15, t4 level 20
    const maxTier = Math.floor(character.level / 5);

    // Validate each talent in the list
    const validTalents: string[] = [];
    const chosenTiers = new Set<number>();

    for (const talentId of talents) {
      // Expect format 't<tier>_<option>' e.g. 't1_1'
      const match = talentId.match(/^t([1-4])_\d+$/);
      if (!match) continue;

      const tier = parseInt(match[1]);

      // Can't choose a tier higher than level allows
      if (tier > maxTier) {
        res.status(400).json({ error: `Talent tier ${tier} requires Level ${tier * 5}. Current level: ${character.level}` });
        return;
      }

      // Can't choose multiple talents in the same tier
      if (chosenTiers.has(tier)) {
        res.status(400).json({ error: `Cannot select multiple talents in tier ${tier}` });
        return;
      }

      chosenTiers.add(tier);
      validTalents.push(talentId);
    }

    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        talents: JSON.stringify(validTalents)
      },
      include: { items: true, user: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REPORT BATTLE COMPLETION (SOLO GRINDING)
characterRouter.post('/report-solo-battle', async (req: Request, res: Response) => {
  const { xpGained, goldGained, countOfKills, mapLevel } = req.body;

  if (xpGained === undefined || goldGained === undefined) {
    res.status(400).json({ error: 'Missing xpGained or goldGained inputs' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { userId: req.user!.id },
      include: { items: true }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    // Anti-cheat verification thresholds:
    // Solo map rewards should not exceed logical maximums based on mapLevel
    const limitFactor = countOfKills ? Math.min(countOfKills, 30) : 10;
    const maxCredibleXp = mapLevel * 100 * limitFactor;
    const maxCredibleGold = mapLevel * 50 * limitFactor;

    if (xpGained > maxCredibleXp || goldGained > maxCredibleGold) {
      res.status(400).json({ error: 'Cheat protection: rewards reported exceed limits' });
      return;
    }

    // 1. Update XP and gold
    let newXp = character.xp + xpGained;
    let newLevel = character.level;
    let xpNeeded = xpToNextLevel(newLevel);

    while (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      xpNeeded = xpToNextLevel(newLevel);
    }

    const newGold = character.gold + goldGained;

    // 2. Roll random loot items (maximum of 2 drops per solo battle run)
    // Solo grinding: Legendary items CANNOT drop. Capped at Epic.
    const lootCreated = [];
    const rollCount = Math.random() < 0.3 ? (Math.random() < 0.2 ? 2 : 1) : 0; // 30% chance for drop, 20% of that drops 2

    for (let i = 0; i < rollCount; i++) {
      // Roll rarity
      const rarRoll = Math.random();
      let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' = 'COMMON';
      if (rarRoll < 0.05) rarity = 'EPIC';
      else if (rarRoll < 0.15) rarity = 'RARE';
      else if (rarRoll < 0.40) rarity = 'UNCOMMON';

      // Roll slot
      const slots: Array<'WEAPON' | 'ARMOR' | 'ACCESSORY'> = ['WEAPON', 'ARMOR', 'ACCESSORY'];
      const slot = slots[Math.floor(Math.random() * slots.length)];

      const itemRaw = generateRandomItem(mapLevel, rarity, slot, character.class);

      lootCreated.push(itemRaw);
    }

    // Save to database
    const updated = await prisma.character.update({
      where: { id: character.id },
      data: {
        level: newLevel,
        xp: newXp,
        gold: newGold,
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
      },
      include: { items: true, user: true }
    });

    res.json({
      character: updated,
      gainedXp: xpGained,
      gainedGold: goldGained,
      leveledUp: newLevel > character.level,
      droppedItems: updated.items.slice(character.items.length) // Returns the newly created items
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
