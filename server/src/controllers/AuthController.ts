import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private authService: AuthService) {}

  devLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username } = req.body;
      const { user, character, token } = await this.authService.devLogin(username);

      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ user, character });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        res.json({ authenticated: false });
        return;
      }

      const result = await this.authService.verifyToken(token);
      res.json(result);
    } catch (error) {
      res.json({ authenticated: false });
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie('token');
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  twitchRedirect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = process.env.TWITCH_CLIENT_ID;
      const redirectUri = process.env.TWITCH_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        if (process.env.NODE_ENV !== 'production') {
          res.status(200).json({ mock: true, message: 'Twitch keys missing. Use dev-login endpoint.' });
        } else {
          res.status(500).json({ error: 'Twitch integration not configured.' });
        }
        return;
      }

      const twitchUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user:read:email`;
      res.redirect(twitchUrl);
    } catch (error) {
      next(error);
    }
  };

  twitchCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;

      if (!code) {
        res.redirect('/');
        return;
      }

      const { user, token } = await this.authService.handleTwitchCallback(code as string);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.redirect('/');
    } catch (error) {
      next(error);
    }
  };
}
