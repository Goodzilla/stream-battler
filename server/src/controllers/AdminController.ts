import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService';
import { syncUserUpdate } from '../socket/lobby';

export class AdminController {
  constructor(private adminService: AdminService) {}

  grantXp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { xpAmount, targetUsername } = req.body;
      const result = await this.adminService.grantXp(req.user!.id, xpAmount, targetUsername);
      if (result.character && result.character.userId) {
        syncUserUpdate(result.character.userId);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  grantGold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { goldAmount, targetUsername } = req.body;
      const result = await this.adminService.grantGold(req.user!.id, goldAmount, targetUsername);
      if (result.character && result.character.userId) {
        syncUserUpdate(result.character.userId);
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  spawnItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slot, rarity, itemLevel } = req.body;
      const result = await this.adminService.spawnItem(req.user!.id, slot, rarity, itemLevel);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  resetCharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.resetCharacter(req.user!.id);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  promoteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username } = req.body;
      const result = await this.adminService.promoteUser(username);
      syncUserUpdate(result.userId);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  };

  unlockAllClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.unlockAllClasses(req.user!.id);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
