import { z } from 'zod';

export const buySchema = z.object({
  body: z.object({
    shopItemId: z.string().min(1, 'Shop Item ID is required')
  })
});

export const gambleSchema = z.object({
  body: z.object({
    slot: z.enum(['WEAPON', 'ARMOR', 'ACCESSORY'])
  })
});
