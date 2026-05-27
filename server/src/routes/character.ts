import { Router } from 'express';
import { characterController } from '../container';
import { authenticateJWT } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  selectClassSchema,
  allocatePassivesSchema,
  selectTalentsSchema,
  reportSoloBattleSchema
} from '../schemas/character.schema';

export const characterRouter = Router();

// Re-export generateShopStock for shop.ts imports compatibility
export { generateShopStock } from '../utils/characterHelper';

// Apply JWT authentication
characterRouter.use(authenticateJWT);

characterRouter.get('/', characterController.getProfile);
characterRouter.post('/select-class', validate(selectClassSchema), characterController.selectClass);
characterRouter.post('/allocate-passives', validate(allocatePassivesSchema), characterController.allocatePassives);
characterRouter.post('/select-talents', validate(selectTalentsSchema), characterController.selectTalents);
characterRouter.post('/report-solo-battle', validate(reportSoloBattleSchema), characterController.reportSoloBattle);
