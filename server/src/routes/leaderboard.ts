import { Router } from 'express';
import { characterController } from '../container';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', characterController.getLeaderboard);
