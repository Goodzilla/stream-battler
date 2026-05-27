import jwt from 'jsonwebtoken';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { ICharacterRepository } from '../repositories/interfaces/ICharacterRepository';
import { IItemRepository } from '../repositories/interfaces/IItemRepository';
import { getActiveCharacter } from '../utils/characterHelper';
import { BadRequestError, NotFoundError, UnauthorizedError, InternalServerError } from '../errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-key-12345!';

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private characterRepository: ICharacterRepository,
    private itemRepository: IItemRepository
  ) {}

  async devLogin(username: string): Promise<{ user: any; character: any; token: string }> {
    const formattedUsername = username.trim().toLowerCase();
    const twitchId = `dev_id_${formattedUsername}`;
    const isAdmin = formattedUsername.includes('admin');

    let user = await this.userRepository.findByTwitchId(twitchId);

    if (!user) {
      user = await this.userRepository.create({
        twitchId,
        username: formattedUsername,
        displayName: username.trim(),
        isAdmin,
        gold: 100,
        activeClass: 'WARRIOR',
        characters: {
          create: {
            class: 'WARRIOR',
            level: 1,
            xp: 0,
            talents: '[]',
            passives: '["start"]'
          }
        }
      });

      // Spawn starter items for the Warrior character
      const warriorChar = user.characters[0];
      await this.itemRepository.createMany([
        {
          userId: user.id,
          equippedCharacterId: warriorChar.id,
          name: 'Rusty Gladius',
          slot: 'WEAPON',
          rarity: 'COMMON',
          itemLevel: 1,
          baseAttack: 5,
          baseDefense: 0,
          affixes: '[]',
          isEquipped: true
        },
        {
          userId: user.id,
          equippedCharacterId: warriorChar.id,
          name: 'Tattered Mail',
          slot: 'ARMOR',
          rarity: 'COMMON',
          itemLevel: 1,
          baseAttack: 0,
          baseDefense: 3,
          affixes: '[]',
          isEquipped: true
        }
      ]);

      // Refetch user with newly created items
      user = await this.userRepository.findById(user.id);
      if (!user) {
        throw new InternalServerError('Failed to load created user profile.');
      }
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const character = getActiveCharacter(user);

    return { user, character, token };
  }

  async verifyToken(token: string): Promise<{ authenticated: boolean; user: any; character: any }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        return { authenticated: false, user: null, character: null };
      }

      return {
        authenticated: true,
        user,
        character: getActiveCharacter(user)
      };
    } catch (err) {
      return { authenticated: false, user: null, character: null };
    }
  }

  async handleTwitchCallback(code: string): Promise<{ user: any; token: string }> {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = process.env.TWITCH_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerError('Twitch environment configuration is missing.');
    }

    // Exchange Twitch code
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json() as any;
    if (!tokenResponse.ok) {
      throw new BadRequestError(tokenData.message || 'Failed to exchange Twitch code');
    }

    const accessToken = tokenData.access_token;

    // Fetch user details from Twitch
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json() as any;
    if (!userResponse.ok) {
      throw new InternalServerError('Failed to fetch user profiles from Twitch API');
    }

    const twitchUser = userData.data[0];
    const twitchId = twitchUser.id;
    const username = twitchUser.login;
    const displayName = twitchUser.display_name;

    let user = await this.userRepository.findByTwitchId(twitchId);

    if (!user) {
      const count = await this.userRepository.count();
      const isAdmin = count === 0 || username === 'heikob';

      user = await this.userRepository.create({
        twitchId,
        username,
        displayName,
        isAdmin,
        gold: 100,
        activeClass: 'WARRIOR',
        characters: {
          create: {
            class: 'WARRIOR',
            level: 1,
            xp: 0,
            talents: '[]',
            passives: '["start"]'
          }
        }
      });

      const warriorChar = user.characters[0];
      await this.itemRepository.createMany([
        {
          userId: user.id,
          equippedCharacterId: warriorChar.id,
          name: 'Rusty Gladius',
          slot: 'WEAPON',
          rarity: 'COMMON',
          itemLevel: 1,
          baseAttack: 5,
          baseDefense: 0,
          affixes: '[]',
          isEquipped: true
        },
        {
          userId: user.id,
          equippedCharacterId: warriorChar.id,
          name: 'Tattered Mail',
          slot: 'ARMOR',
          rarity: 'COMMON',
          itemLevel: 1,
          baseAttack: 0,
          baseDefense: 3,
          affixes: '[]',
          isEquipped: true
        }
      ]);

      user = await this.userRepository.findById(user.id);
      if (!user) {
        throw new InternalServerError('Failed to load created user profile.');
      }
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }
}
