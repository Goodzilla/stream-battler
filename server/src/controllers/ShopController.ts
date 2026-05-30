import { Request, Response, NextFunction } from 'express';
import { ShopService } from '../services/ShopService';
import { syncUserUpdate } from '../socket/lobby';

export class ShopController {
  constructor(private shopService: ShopService) {}

  getShopData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.shopService.getShopData(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  refreshStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.shopService.refreshShop(req.user!.id);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  buy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shopItemId } = req.body;
      const result = await this.shopService.buyShopItem(req.user!.id, shopItemId);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  gamble = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slot } = req.body;
      const result = await this.shopService.gambleItem(req.user!.id, slot);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
