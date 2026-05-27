import { z } from 'zod';

export const equipSchema = z.object({
  body: z.object({
    itemId: z.string().uuid('Invalid Item ID format')
  })
});

export const unequipSchema = z.object({
  body: z.object({
    itemId: z.string().uuid('Invalid Item ID format')
  })
});

export const dismantleSchema = z.object({
  body: z.object({
    itemId: z.string().uuid('Invalid Item ID format')
  })
});
