import { Router } from 'express';
import { inventoryController } from '../container';
import { authenticateJWT } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { equipSchema, unequipSchema, dismantleSchema } from '../schemas/inventory.schema';

export const inventoryRouter = Router();

inventoryRouter.use(authenticateJWT);

inventoryRouter.post('/equip', validate(equipSchema), inventoryController.equip);
inventoryRouter.post('/unequip', validate(unequipSchema), inventoryController.unequip);
inventoryRouter.post('/dismantle', validate(dismantleSchema), inventoryController.dismantle);
inventoryRouter.post('/dismantle-all', inventoryController.dismantleAll);
