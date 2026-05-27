import { z } from 'zod';

export const devLoginSchema = z.object({
  body: z.object({
    username: z.string()
      .trim()
      .min(1, 'Username is required')
      .max(25, 'Username must be at most 25 characters')
  })
});
