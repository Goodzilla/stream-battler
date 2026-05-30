import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/InventoryService';
import { syncUserUpdate } from '../socket/lobby';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  equip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId } = req.body;
      const result = await this.inventoryService.equipItem(req.user!.id, itemId);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  unequip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId } = req.body;
      const result = await this.inventoryService.unequipItem(req.user!.id, itemId);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  dismantle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId } = req.body;
      const result = await this.inventoryService.dismantleItem(req.user!.id, itemId);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  dismantleAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.inventoryService.dismantleAll(req.user!.id);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
