import { Router } from 'express';
import { shopController } from '../container';
import { authenticateJWT } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { buySchema, gambleSchema } from '../schemas/shop.schema';

export const shopRouter = Router();

shopRouter.use(authenticateJWT);

shopRouter.get('/', shopController.getShopData);
shopRouter.post('/refresh', shopController.refreshStock);
shopRouter.post('/buy', validate(buySchema), shopController.buy);
shopRouter.post('/gamble', validate(gambleSchema), shopController.gamble);
