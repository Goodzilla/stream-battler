import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activeLobbies, handleChatJoin } from '../lobby';
import { prisma } from '../../db';

vi.mock('../../db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    character: {
      create: vi.fn(),
      update: vi.fn()
    },
    item: {
      createMany: vi.fn()
    }
  }
}));

describe('Twitch Chat Lobby Join Handler', () => {
  let mockIo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear active lobbies
    for (const key in activeLobbies) {
      delete activeLobbies[key];
    }

    mockIo = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn()
      }),
      emit: vi.fn()
    };

    // Set default mock implementations to avoid undefined errors
    vi.mocked(prisma.character.create).mockResolvedValue({ id: 'mock_char_id' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    vi.mocked(prisma.item.createMany).mockResolvedValue({ count: 2 } as any);
  });

  it('should ignore messages that do not start with !join', async () => {
    activeLobbies['streamer1'] = {
      streamerName: 'streamer1',
      viewers: [],
      status: 'LOBBY',
      bossName: 'Test Boss',
      bossLevel: 10
    };

    await handleChatJoin(mockIo, 'streamer1', 'chatter1', 'hello there');
    
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(activeLobbies['streamer1'].viewers.length).toBe(0);
  });

  it('should register a new chatter with a starter class', async () => {
    activeLobbies['streamer1'] = {
      streamerName: 'streamer1',
      viewers: [],
      status: 'LOBBY',
      bossName: 'Test Boss',
      bossLevel: 10
    };

    const mockCreatedUser = {
      id: 'new_user_id',
      twitchId: 'sim_twitch_chatter1',
      username: 'chatter1',
      displayName: 'chatter1',
      gold: 50,
      activeClass: 'MAGE',
      characters: [
        {
          id: 'char_id',
          class: 'MAGE',
          level: 1,
          talents: '[]',
          passives: '["start"]'
        }
      ],
      items: [
        { id: 'i1', slot: 'WEAPON', rarity: 'COMMON', isEquipped: true, equippedCharacterId: 'char_id' },
        { id: 'i2', slot: 'ARMOR', rarity: 'COMMON', isEquipped: true, equippedCharacterId: 'char_id' }
      ]
    };

    // User lookup initially returns null
    (prisma.user.findUnique as any).mockImplementation(async (args: any) => {
      if (args.where.twitchId) return null;
      if (args.where.id === 'new_user_id') return mockCreatedUser as any;
      return null;
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);

    await handleChatJoin(mockIo, 'streamer1', 'chatter1', '!join mage');

    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.item.createMany).toHaveBeenCalled();
    expect(activeLobbies['streamer1'].viewers.length).toBe(1);
    expect(activeLobbies['streamer1'].viewers[0].username).toBe('chatter1');
    expect(activeLobbies['streamer1'].viewers[0].charClass).toBe('MAGE');
  });

  it('should enforce advanced class lock and fallback to base class', async () => {
    activeLobbies['streamer1'] = {
      streamerName: 'streamer1',
      viewers: [],
      status: 'LOBBY',
      bossName: 'Test Boss',
      bossLevel: 10
    };

    // Mock existing user profile with level 1 Cleric trying to join as Monk
    const mockExistingUser = {
      id: 'existing_id',
      twitchId: 'sim_twitch_chatter1',
      username: 'chatter1',
      displayName: 'chatter1',
      gold: 150,
      activeClass: 'CLERIC',
      characters: [
        {
          id: 'char_cleric_id',
          class: 'CLERIC',
          level: 1, // cleric is only lvl 1 (requires 100 to unlock monk)
          talents: '[]',
          passives: '["start"]'
        }
      ],
      items: []
    };
    
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockExistingUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockExistingUser as any);

    // Call join with monk
    await handleChatJoin(mockIo, 'streamer1', 'chatter1', '!join monk');

    // Should NOT create/switch to monk because level 100 cleric requirement is not met.
    // It stays CLERIC.
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(activeLobbies['streamer1'].viewers[0].charClass).toBe('CLERIC');
  });

  it('should allow joining as advanced class if base class is level 100', async () => {
    activeLobbies['streamer1'] = {
      streamerName: 'streamer1',
      viewers: [],
      status: 'LOBBY',
      bossName: 'Test Boss',
      bossLevel: 10
    };

    // Mock existing user profile with level 100 Warrior trying to join as Valkyrie
    const mockExistingUser = {
      id: 'existing_id',
      twitchId: 'sim_twitch_chatter1',
      username: 'chatter1',
      displayName: 'chatter1',
      gold: 150,
      activeClass: 'WARRIOR',
      characters: [
        {
          id: 'char_war_id',
          class: 'WARRIOR',
          level: 100, // level 100 warrior! unlocks valkyrie
          talents: '[]',
          passives: '["start"]'
        }
      ],
      items: []
    };
    
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockExistingUser as any);
    (prisma.user.findUnique as any).mockImplementation(async (args: any) => {
      if (args.where.twitchId) return mockExistingUser as any;
      if (args.where.id === 'existing_id') {
        return {
          ...mockExistingUser,
          activeClass: 'VALKYRIE',
          characters: [
            ...mockExistingUser.characters,
            {
              id: 'char_valk_id',
              class: 'VALKYRIE',
              level: 1,
              talents: '[]',
              passives: '["start"]'
            }
          ],
          items: []
        } as any;
      }
      return null;
    });

    vi.mocked(prisma.character.create).mockResolvedValue({ id: 'char_valk_id', class: 'VALKYRIE' } as any);

    // Call join with valkyrie
    await handleChatJoin(mockIo, 'streamer1', 'chatter1', '!join valkyrie');

    // Should create new character of class VALKYRIE and update user activeClass
    expect(prisma.character.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ class: 'VALKYRIE' })
    }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { activeClass: 'VALKYRIE' }
    }));
    expect(activeLobbies['streamer1'].viewers[0].charClass).toBe('VALKYRIE');
  });
});
