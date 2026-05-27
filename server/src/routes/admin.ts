import { Router, Request, Response, NextFunction } from 'express';
import { adminController } from '../container';
import { authenticateJWT } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  grantXpSchema,
  grantGoldSchema,
  spawnItemSchema,
  promoteUserSchema
} from '../schemas/admin.schema';

export const adminRouter = Router();

// Apply auth middleware
adminRouter.use(authenticateJWT);

// Authorization middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Access denied: Admin permissions required' });
    return;
  }
  next();
};

adminRouter.use(requireAdmin);

adminRouter.post('/grant-xp', validate(grantXpSchema), adminController.grantXp);
adminRouter.post('/grant-gold', validate(grantGoldSchema), adminController.grantGold);
adminRouter.post('/spawn-item', validate(spawnItemSchema), adminController.spawnItem);
adminRouter.post('/reset-character', adminController.resetCharacter);
adminRouter.post('/promote-user', validate(promoteUserSchema), adminController.promoteUser);
adminRouter.post('/unlock-all-classes', adminController.unlockAllClasses);
