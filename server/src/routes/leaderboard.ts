import { Router, Request, Response } from 'express';
import { prisma } from '../db';

export const leaderboardRouter = Router();

// GET LEADERBOARDS
leaderboardRouter.get('/', async (req: Request, res: Response) => {
  const charClass = req.query.class as string | undefined;

  try {
    const queryOptions: any = {
      take: 20,
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' }
      ],
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            gold: true
          }
        },
        equippedItems: true
      }
    };

    if (charClass && ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'].includes(charClass.toUpperCase())) {
      queryOptions.where = {
        class: charClass.toUpperCase()
      };
    }

    const leaders = await prisma.character.findMany(queryOptions) as any[];

    // Map output to be clean
    const rankings = leaders.map((char, index) => {
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

    res.json(rankings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
