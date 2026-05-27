import { User, Character, Item } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & { character: (Character & { items: Item[] }) | null };
    }
  }
}
