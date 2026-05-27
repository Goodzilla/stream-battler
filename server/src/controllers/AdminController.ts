import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService';

export class AdminController {
  constructor(private adminService: AdminService) {}

  grantXp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { xpAmount, targetUsername } = req.body;
      const result = await this.adminService.grantXp(req.user!.id, xpAmount, targetUsername);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  grantGold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { goldAmount, targetUsername } = req.body;
      const result = await this.adminService.grantGold(req.user!.id, goldAmount, targetUsername);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  spawnItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slot, rarity, itemLevel } = req.body;
      const result = await this.adminService.spawnItem(req.user!.id, slot, rarity, itemLevel);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  resetCharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.resetCharacter(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  promoteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username } = req.body;
      const message = await this.adminService.promoteUser(username);
      res.json({ success: true, message });
    } catch (error) {
      next(error);
    }
  };

  unlockAllClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.unlockAllClasses(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
