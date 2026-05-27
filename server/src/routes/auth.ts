import { Router } from 'express';
import { authController } from '../container';
import { validate } from '../middlewares/validate';
import { devLoginSchema } from '../schemas/auth.schema';

export const authRouter = Router();

// Re-export character helpers for WebSocket/Lobby imports compatibility
export { resolveActiveClass, getActiveCharacter } from '../utils/characterHelper';

authRouter.post('/dev-login', validate(devLoginSchema), authController.devLogin);
authRouter.get('/me', authController.me);
authRouter.post('/logout', authController.logout);
authRouter.get('/twitch', authController.twitchRedirect);
authRouter.get('/twitch/callback', authController.twitchCallback);
