import { z } from 'zod';

export const grantXpSchema = z.object({
  body: z.object({
    xpAmount: z.union([z.number(), z.string()]).transform((val) => {
      const parsed = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('XP amount must be a positive number');
      }
      return parsed;
    }),
    targetUsername: z.string().optional()
  })
});

export const grantGoldSchema = z.object({
  body: z.object({
    goldAmount: z.union([z.number(), z.string()]).transform((val) => {
      const parsed = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(parsed)) {
        throw new Error('Gold amount must be a number');
      }
      return parsed;
    }),
    targetUsername: z.string().optional()
  })
});

export const spawnItemSchema = z.object({
  body: z.object({
    slot: z.enum(['WEAPON', 'ARMOR', 'ACCESSORY']),
    rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']),
    itemLevel: z.union([z.number(), z.string()]).transform((val) => {
      const parsed = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Item level must be a positive integer');
      }
      return parsed;
    })
  })
});

export const promoteUserSchema = z.object({
  body: z.object({
    username: z.string().trim().min(1, 'Username is required')
  })
});
