import { z } from 'zod';

export const selectClassSchema = z.object({
  body: z.object({
    charClass: z.string().toUpperCase()
  })
});

export const allocatePassivesSchema = z.object({
  body: z.object({
    passives: z.array(z.string())
  })
});

export const selectTalentsSchema = z.object({
  body: z.object({
    talents: z.array(z.string())
  })
});

export const reportSoloBattleSchema = z.object({
  body: z.object({
    xpGained: z.number().int().nonnegative('XP gained must be a non-negative integer'),
    goldGained: z.number().int().nonnegative('Gold gained must be a non-negative integer'),
    countOfKills: z.number().int().nonnegative().optional(),
    mapLevel: z.number().int().positive('Map level must be a positive integer'),
    won: z.boolean()
  })
});
