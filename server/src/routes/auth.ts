import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-key-12345!';

// Middleware to authenticate user via JWT cookie
export const authenticateJWT = async (req: Request, res: Response, next: () => void) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { character: { include: { items: true, user: true } } }
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// DEV LOGIN - Only works in development mode (or if bypassed)
authRouter.post('/dev-login', async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  // Check if dev mode is restricted
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Developer login is disabled in production' });
    return;
  }

  try {
    const formattedUsername = username.trim().toLowerCase();
    const twitchId = `dev_id_${formattedUsername}`;

    // Auto admin if username contains admin
    const isAdmin = formattedUsername.includes('admin');

    let user = await prisma.user.findUnique({
      where: { twitchId },
      include: { character: { include: { items: true, user: true } } }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          twitchId,
          username: formattedUsername,
          displayName: username.trim(),
          isAdmin,
          character: {
            create: {
              class: 'WARRIOR', // Default to Warrior
              level: 1,
              xp: 0,
              gold: 100,
              talents: '[]',
              passives: '["start"]' // Initialize with start node
            }
          }
        },
        include: { character: { include: { items: true, user: true } } }
      });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ user, character: user.character });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET CURRENT USER PROFILE
authRouter.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) {
    res.json({ authenticated: false });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { character: { include: { items: true, user: true } } }
    });

    if (!user) {
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, user, character: user.character });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

// LOGOUT
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// TWITCH OAUTH MOCK / REDIRECT
authRouter.get('/twitch', (req: Request, res: Response) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = process.env.TWITCH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    // If not configured, in dev we can redirect to dev login, in prod we warn
    if (process.env.NODE_ENV !== 'production') {
      res.status(200).json({ mock: true, message: 'Twitch keys missing. Use dev-login endpoint.' });
    } else {
      res.status(500).json({ error: 'Twitch integration not configured.' });
    }
    return;
  }

  const twitchUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user:read:email`;
  res.redirect(twitchUrl);
});

// TWITCH CALLBACK
authRouter.get('/twitch/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    res.redirect('/');
    return;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = process.env.TWITCH_REDIRECT_URI;

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri!
      })
    });

    const tokenData = await tokenResponse.json() as any;
    if (!tokenResponse.ok) throw new Error(tokenData.message || 'Failed to exchange Twitch code');

    const accessToken = tokenData.access_token;

    // Get User Profile from Twitch Helix API
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': clientId!,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json() as any;
    if (!userResponse.ok) throw new Error('Failed to fetch Twitch user data');

    const twitchUser = userData.data[0];
    const twitchId = twitchUser.id;
    const username = twitchUser.login;
    const displayName = twitchUser.display_name;

    // Check if user exists, else create
    let user = await prisma.user.findUnique({
      where: { twitchId },
      include: { character: { include: { items: true, user: true } } }
    });

    if (!user) {
      // First user is admin, or check config
      const count = await prisma.user.count();
      const isAdmin = count === 0; // Make first registered user admin for easy setup

      user = await prisma.user.create({
        data: {
          twitchId,
          username,
          displayName,
          isAdmin,
          character: {
            create: {
              class: 'WARRIOR',
              level: 1,
              xp: 0,
              gold: 100,
              talents: '[]',
              passives: '["start"]'
            }
          }
        },
        include: { character: { include: { items: true, user: true } } }
      });
    }

    const jwtToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect user back to character dashboard
    res.redirect('/');
  } catch (err: any) {
    res.status(500).send(`Authentication error: ${err.message}`);
  }
});
