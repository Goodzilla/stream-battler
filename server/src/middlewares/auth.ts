import { Request, Response, NextFunction } from 'express';
import { authService } from '../container';
import { UnauthorizedError } from '../errors/AppError';

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  try {
    const result = await authService.verifyToken(token);
    if (!result.authenticated || !result.user) {
      res.status(401).json({ error: 'Unauthorized: User not found or invalid token' });
      return;
    }

    req.user = {
      ...result.user,
      character: result.character
    } as any;
    
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
