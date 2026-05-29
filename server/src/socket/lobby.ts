import { Server, Socket } from 'socket.io';
import { prisma } from '../db';
import { generateRandomItem, xpToNextLevel, calculateCharacterStats } from 'shared';
import { resolveActiveClass, getActiveCharacter } from '../routes/auth';
import tmi from 'tmi.js';

export interface LobbyViewer {
  userId: string;
  username: string;
  displayName: string;
  charClass: string;
  level: number;
  weaponRarity: string;
  armorRarity: string;
  // Combat stats
  maxHp: number;
  attackPower: number;
  defense: number;
  critChance: number;
  critMult: number;
  atkSpeed: number;
  lifesteal: number;
  reflect: number;
  cdr: number;
  speed: number;
  selectedTalents: string[];
  fireRes: number;
  coldRes: number;
  poisonRes: number;
  physRes: number;
}

export interface LobbyState {
  streamerName: string;
  viewers: LobbyViewer[];
  status: 'LOBBY' | 'FIGHTING';
  bossName: string;
  bossLevel: number;
  startedAt?: number;
}

// In-memory registry of active lobbies
export const activeLobbies: Record<string, LobbyState> = {};

// In-memory mapping of active Twitch IRC client connections
const twitchClients: Record<string, tmi.Client> = {};

const CLASS_UNLOCK_REQUIREMENTS: Record<string, string> = {
  VALKYRIE: 'WARRIOR',
  NECROMANCER: 'MAGE',
  MONK: 'CLERIC',
  ALCHEMIST: 'ROGUE',
  BARD: 'RANGER'
};

/**
 * Unified helper function to handle spectator joining via chat (Twitch IRC or simulated).
 */
export async function handleChatJoin(
  io: Server,
  streamerName: string,
  senderName: string,
  message: string,
  twitchUserId?: string
) {
  const streamerKey = streamerName.toLowerCase();
  const roomName = `lobby_${streamerKey}`;
  const lobby = activeLobbies[streamerKey];

  if (!lobby || lobby.status !== 'LOBBY') return;

  const messageTrim = message.trim();
  const lowerMsg = messageTrim.toLowerCase();
  if (!lowerMsg.startsWith('!join')) return;

  // Extract requested class if provided, e.g. "!join warrior"
  const parts = messageTrim.split(/\s+/);
  let requestedClass: string | null = null;
  if (parts.length > 1) {
    const classArg = parts[1].toUpperCase();
    if (['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER', 'VALKYRIE', 'NECROMANCER', 'MONK', 'ALCHEMIST', 'BARD'].includes(classArg)) {
      requestedClass = classArg;
    }
  }

  try {
    let user = null;

    // 1. Attempt to find user by twitch ID (for real Twitch viewers)
    if (twitchUserId) {
      user = await prisma.user.findUnique({
        where: { twitchId: twitchUserId },
        include: { characters: true, items: true }
      });
    }

    // 2. Fallback to lookup by username
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username: senderName.toLowerCase() },
        include: { characters: true, items: true }
      });
    }

    // 3. Fallback to simulation Twitch ID prefix
    const simTwitchId = `sim_twitch_${senderName.toLowerCase()}`;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { twitchId: simTwitchId },
        include: { characters: true, items: true }
      });
    }

    // 4. Create user if they don't exist
    if (!user) {
      const startClass = requestedClass || ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'][Math.floor(Math.random() * 5)];
      
      user = await prisma.user.create({
        data: {
          twitchId: twitchUserId || simTwitchId,
          username: senderName.toLowerCase(),
          displayName: senderName,
          gold: 50,
          activeClass: startClass,
          characters: {
            create: {
              class: startClass,
              level: Math.floor(Math.random() * 3) + 1,
              xp: 0,
              talents: '[]',
              passives: '["start"]'
            }
          }
        },
        include: { characters: true, items: true }
      });

      const simChar = user.characters[0];
      const weaponName = 
        startClass === 'WARRIOR' ? 'Rusty Gladius' :
        startClass === 'MAGE' ? 'Initiate Wand' :
        startClass === 'CLERIC' ? 'Novice Scepter' :
        startClass === 'ROGUE' ? 'Serrated Dirk' :
        startClass === 'RANGER' ? 'Trimming Bow' :
        startClass === 'VALKYRIE' ? 'Novice Spear' :
        startClass === 'NECROMANCER' ? 'Apprentice Scythe' :
        startClass === 'MONK' ? 'Worn Fist Wraps' :
        startClass === 'ALCHEMIST' ? 'Crude Flask' : 'Tuned Lute';

      const armorName =
        startClass === 'WARRIOR' ? 'Tattered Mail' :
        startClass === 'MAGE' ? 'Apprentice Robe' :
        startClass === 'CLERIC' ? 'Acolyte Vestment' :
        startClass === 'ROGUE' ? 'Scout Leather' :
        startClass === 'RANGER' ? 'Scout Leather' :
        startClass === 'VALKYRIE' ? 'Valkyrie Plate' :
        startClass === 'NECROMANCER' ? 'Dark Robe' :
        startClass === 'MONK' ? 'Monk Gi' :
        startClass === 'ALCHEMIST' ? 'Alchemist Coat' : 'Bard Garb';

      await prisma.item.createMany({
        data: [
          {
            userId: user.id,
            equippedCharacterId: simChar.id,
            name: weaponName,
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
            equippedCharacterId: simChar.id,
            name: armorName,
            slot: 'ARMOR',
            rarity: 'COMMON',
            itemLevel: 1,
            baseAttack: 0,
            baseDefense: 3,
            affixes: '[]',
            isEquipped: true
          }
        ]
      });

      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { characters: true, items: true }
      }) as any;
    } else {
      // User exists. Enforce locks on advanced class selection if requested.
      if (requestedClass) {
        const requiredBaseClass = CLASS_UNLOCK_REQUIREMENTS[requestedClass];
        if (requiredBaseClass) {
          const baseChar = user.characters.find(c => c.class === requiredBaseClass);
          if (!baseChar || baseChar.level < 100) {
            requestedClass = requiredBaseClass; // Fallback to base starting class
          }
        }

        // Switch class if they requested a different unlocked class
        if (user.activeClass !== requestedClass) {
          let char = user.characters.find(c => c.class === requestedClass);
          if (!char) {
            char = await prisma.character.create({
              data: {
                userId: user.id,
                class: requestedClass,
                level: 1,
                xp: 0,
                talents: '[]',
                passives: '["start"]'
              }
            });

            const weaponName = 
              requestedClass === 'WARRIOR' ? 'Rusty Gladius' :
              requestedClass === 'MAGE' ? 'Initiate Wand' :
              requestedClass === 'CLERIC' ? 'Novice Scepter' :
              requestedClass === 'ROGUE' ? 'Serrated Dirk' :
              requestedClass === 'RANGER' ? 'Trimming Bow' :
              requestedClass === 'VALKYRIE' ? 'Novice Spear' :
              requestedClass === 'NECROMANCER' ? 'Apprentice Scythe' :
              requestedClass === 'MONK' ? 'Worn Fist Wraps' :
              requestedClass === 'ALCHEMIST' ? 'Crude Flask' : 'Tuned Lute';

            const armorName =
              requestedClass === 'WARRIOR' ? 'Tattered Mail' :
              requestedClass === 'MAGE' ? 'Apprentice Robe' :
              requestedClass === 'CLERIC' ? 'Acolyte Vestment' :
              requestedClass === 'ROGUE' ? 'Scout Leather' :
              requestedClass === 'RANGER' ? 'Scout Leather' :
              requestedClass === 'VALKYRIE' ? 'Valkyrie Plate' :
              requestedClass === 'NECROMANCER' ? 'Dark Robe' :
              requestedClass === 'MONK' ? 'Monk Gi' :
              requestedClass === 'ALCHEMIST' ? 'Alchemist Coat' : 'Bard Garb';

            await prisma.item.createMany({
              data: [
                {
                  userId: user.id,
                  equippedCharacterId: char.id,
                  name: weaponName,
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
                  equippedCharacterId: char.id,
                  name: armorName,
                  slot: 'ARMOR',
                  rarity: 'COMMON',
                  itemLevel: 1,
                  baseAttack: 0,
                  baseDefense: 3,
                  affixes: '[]',
                  isEquipped: true
                }
              ]
            });
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { activeClass: requestedClass }
          });
          user.activeClass = requestedClass;

          user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { characters: true, items: true }
          }) as any;
        }
      }
    }

    const activeClass = resolveActiveClass(user!);
    const char = user!.characters.find((c: any) => c.class === activeClass);
    if (char) {
      const weapon = user!.items.find((i: any) => i.slot === 'WEAPON' && i.isEquipped && i.equippedCharacterId === char.id);
      const armor = user!.items.find((i: any) => i.slot === 'ARMOR' && i.isEquipped && i.equippedCharacterId === char.id);

      const charStats = calculateCharacterStats(
        char.class,
        char.level,
        JSON.parse(char.talents || '[]'),
        JSON.parse(char.passives || '[]'),
        user!.items.filter((i: any) => i.isEquipped && i.equippedCharacterId === char.id) as any
      );

      const viewerData: LobbyViewer = {
        userId: user!.id,
        username: user!.username,
        displayName: user!.displayName,
        charClass: char.class,
        level: char.level,
        weaponRarity: weapon ? weapon.rarity : 'COMMON',
        armorRarity: armor ? armor.rarity : 'COMMON',
        maxHp: charStats.maxHp,
        attackPower: charStats.attackPower,
        defense: charStats.defense,
        critChance: charStats.critChance,
        critMult: charStats.critMult,
        atkSpeed: charStats.atkSpeed,
        lifesteal: charStats.lifesteal,
        reflect: charStats.reflect,
        cdr: charStats.cdr,
        speed: charStats.moveSpeed,
        selectedTalents: JSON.parse(char.talents || '[]'),
        fireRes: charStats.fireRes,
        coldRes: charStats.coldRes,
        poisonRes: charStats.poisonRes,
        physRes: charStats.physRes
      };

      const alreadyJoined = lobby.viewers.some(v => v.userId === user!.id);
      if (!alreadyJoined && lobby.viewers.length >= 100) {
        io.to(roomName).emit('chat-log-received', {
          sender: 'SYSTEM',
          message: `@${senderName}, the raid is full! Max 100 players.`,
          timestamp: Date.now()
        });
        return;
      }

      lobby.viewers = lobby.viewers.filter(v => v.userId !== user!.id);
      lobby.viewers.push(viewerData);

      io.to(`user_${user!.id}`).emit('boot-from-solo-arena');
      io.to(roomName).emit('lobby-update', lobby);
      io.emit('global-lobbies-update', Object.values(activeLobbies));
    }
  } catch (err) {
    console.error('Error handling chat join:', err);
  }
}

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    let currentLobby: string | null = null;
    let isStreamer = false;
    let connectedUserId: string | null = null;

    // USER REGISTRATION FOR PERSONAL ROOM (For notifications like booting from solo runs)
    socket.on('register-user', (userId) => {
      socket.join(`user_${userId}`);
    });

    // STREAMER: CREATE LOBBY
    socket.on('create-lobby', async ({ streamerName, bossName, bossLevel }) => {
      const roomName = `lobby_${streamerName.toLowerCase()}`;
      currentLobby = roomName;
      isStreamer = true;

      socket.join(roomName);

      const viewers: LobbyViewer[] = [];

      try {
        const user = await prisma.user.findFirst({
          where: { username: streamerName },
          include: { characters: true, items: true }
        });

        if (user) {
          const activeClass = resolveActiveClass(user);
          const char = user.characters.find(c => c.class === activeClass);
          if (char) {
            const weapon = user.items.find(i => i.slot === 'WEAPON' && i.isEquipped && i.equippedCharacterId === char.id);
            const armor = user.items.find(i => i.slot === 'ARMOR' && i.isEquipped && i.equippedCharacterId === char.id);

            const charStats = calculateCharacterStats(
              char.class,
              char.level,
              JSON.parse(char.talents || '[]'),
              JSON.parse(char.passives || '[]'),
              user.items.filter(i => i.isEquipped && i.equippedCharacterId === char.id) as any
            );

            const viewerData: LobbyViewer = {
              userId: user.id,
              username: user.username,
              displayName: user.displayName,
              charClass: char.class,
              level: char.level,
              weaponRarity: weapon ? weapon.rarity : 'COMMON',
              armorRarity: armor ? armor.rarity : 'COMMON',
              maxHp: charStats.maxHp,
              attackPower: charStats.attackPower,
              defense: charStats.defense,
              critChance: charStats.critChance,
              critMult: charStats.critMult,
              atkSpeed: charStats.atkSpeed,
              lifesteal: charStats.lifesteal,
              reflect: charStats.reflect,
              cdr: charStats.cdr,
              speed: charStats.moveSpeed,
              selectedTalents: JSON.parse(char.talents || '[]'),
              fireRes: charStats.fireRes,
              coldRes: charStats.coldRes,
              poisonRes: charStats.poisonRes,
              physRes: charStats.physRes
            };

            viewers.push(viewerData);
          }
        }
      } catch (err) {
        console.error('Error adding streamer to lobby:', err);
      }

      activeLobbies[streamerName.toLowerCase()] = {
        streamerName,
        viewers,
        status: 'LOBBY',
        bossName: bossName || 'Beholder of Neon',
        bossLevel: bossLevel || 5
      };

      io.to(roomName).emit('lobby-update', activeLobbies[streamerName.toLowerCase()]);
      io.emit('global-lobbies-update', Object.values(activeLobbies)); // Alert everyone of new lobby

      // Connect to streamer's Twitch chat channel asynchronously
      const streamerKey = streamerName.toLowerCase();
      if (twitchClients[streamerKey]) {
        try {
          await twitchClients[streamerKey].disconnect();
        } catch (e) {
          console.error(`Error disconnecting old Twitch client for ${streamerName}:`, e);
        }
        delete twitchClients[streamerKey];
      }

      (async () => {
        try {
          const client = new tmi.Client({
            options: { debug: false },
            connection: {
              reconnect: true,
              secure: true
            },
            channels: [ streamerName ]
          });

          client.on('message', async (channel, tags, msg, self) => {
            if (self) return;

            // Broadcast message to the lobby socket room
            io.to(roomName).emit('chat-log-received', {
              sender: tags['display-name'] || tags['username'] || 'TwitchUser',
              message: msg,
              timestamp: Date.now()
            });

            // Parse and handle join
            if (msg.trim().toLowerCase().startsWith('!join')) {
              await handleChatJoin(
                io,
                streamerName,
                tags['username'] || tags['display-name'] || 'TwitchUser',
                msg,
                tags['user-id']
              );
            }
          });

          await client.connect();
          twitchClients[streamerKey] = client;
          console.log(`Successfully connected to Twitch chat for channel: ${streamerName}`);
        } catch (err) {
          console.error(`Failed to connect to Twitch chat for channel ${streamerName}:`, err);
        }
      })();
    });

    // VIEWER/STREAMER: JOIN LOBBY
    socket.on('join-lobby', async ({ streamerName, userId, username, displayName }) => {
      connectedUserId = userId;
      const streamerKey = streamerName.toLowerCase();
      const roomName = `lobby_${streamerKey}`;
      currentLobby = roomName;

      socket.join(roomName);
      io.to(`user_${userId}`).emit('boot-from-solo-arena');

      const lobby = activeLobbies[streamerKey];
      if (lobby) {
        // Find player's characters and items in DB
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { characters: true, items: true }
        });

        if (user) {
          const activeClass = resolveActiveClass(user);
          const char = user.characters.find(c => c.class === activeClass);
          if (char) {
            const weapon = user.items.find(i => i.slot === 'WEAPON' && i.isEquipped && i.equippedCharacterId === char.id);
            const armor = user.items.find(i => i.slot === 'ARMOR' && i.isEquipped && i.equippedCharacterId === char.id);

            const charStats = calculateCharacterStats(
              char.class,
              char.level,
              JSON.parse(char.talents || '[]'),
              JSON.parse(char.passives || '[]'),
              user.items.filter(i => i.isEquipped && i.equippedCharacterId === char.id) as any
            );

            const viewerData: LobbyViewer = {
              userId: user.id,
              username: user.username,
              displayName: user.displayName,
              charClass: char.class,
              level: char.level,
              weaponRarity: weapon ? weapon.rarity : 'COMMON',
              armorRarity: armor ? armor.rarity : 'COMMON',
              maxHp: charStats.maxHp,
              attackPower: charStats.attackPower,
              defense: charStats.defense,
              critChance: charStats.critChance,
              critMult: charStats.critMult,
              atkSpeed: charStats.atkSpeed,
              lifesteal: charStats.lifesteal,
              reflect: charStats.reflect,
              cdr: charStats.cdr,
              speed: charStats.moveSpeed,
              selectedTalents: JSON.parse(char.talents || '[]'),
              fireRes: charStats.fireRes,
              coldRes: charStats.coldRes,
              poisonRes: charStats.poisonRes,
              physRes: charStats.physRes
            };

            // Enforce 100 player cap
            const alreadyJoined = lobby.viewers.some(v => v.userId === userId);
            if (!alreadyJoined && lobby.viewers.length >= 100) {
              socket.emit('lobby-error', { error: 'Lobby is full! Max 100 players.' });
              return;
            }
            // Deduplicate viewers
            lobby.viewers = lobby.viewers.filter(v => v.userId !== userId);
            lobby.viewers.push(viewerData);

            io.to(roomName).emit('lobby-update', lobby);
            io.emit('global-lobbies-update', Object.values(activeLobbies));
          }
        }
      }
    });

    // SIMULATED CHAT JOIN / CHAT EVENT
    socket.on('simulate-chat-message', async ({ streamerName, message, senderName }) => {
      const streamerKey = streamerName.toLowerCase();
      const roomName = `lobby_${streamerKey}`;

      // Broadcast chat message to the lobby room
      io.to(roomName).emit('chat-log-received', {
        sender: senderName,
        message,
        timestamp: Date.now()
      });

      // Parse join command: "!join"
      if (message.trim().toLowerCase().startsWith('!join')) {
        await handleChatJoin(io, streamerName, senderName, message);
      }
    });

    // STREAMER: START RAID
    socket.on('start-raid', ({ streamerName }) => {
      const streamerKey = streamerName.toLowerCase();
      const roomName = `lobby_${streamerKey}`;
      const lobby = activeLobbies[streamerKey];

      if (lobby && lobby.status === 'LOBBY') {
        lobby.status = 'FIGHTING';
        lobby.startedAt = Date.now();

        io.to(roomName).emit('raid-started', lobby);
        io.emit('global-lobbies-update', Object.values(activeLobbies));
      }
    });

    // STREAMER: BROADCAST COMBAT STATE SNAPSHOTS
    socket.on('streamer-state-update', ({ streamerName, snapshot }) => {
      const roomName = `lobby_${streamerName.toLowerCase()}`;
      socket.to(roomName).emit('raid-state-broadcast', snapshot);
    });

    // STREAMER: END RAID (VICTORY / DEFEAT) - Awards gold to User and items to User backpack
    socket.on('streamer-raid-end', async ({ streamerName, success, bossName, bossLevel, recapStats }) => {
      const streamerKey = streamerName.toLowerCase();
      const roomName = `lobby_${streamerKey}`;
      const lobby = activeLobbies[streamerKey];

      if (lobby && lobby.status === 'FIGHTING') {
        lobby.status = 'LOBBY';

        const rewards: Record<string, { xp: number; gold: number; itemDropped?: any; inventoryFull?: boolean }> = {};
        try {
          // Log raid history
          await prisma.raidHistory.create({
            data: {
              streamerName: lobby.streamerName,
              bossName,
              bossLevel,
              participants: lobby.viewers.length,
              success
            }
          });

          // Award loot if successful
          if (success) {
            // Calculate average contribution score of players
            const totalScore = (recapStats || []).reduce((sum: number, stat: any) => sum + (stat.score || 0), 0);
            const activeParticipantsCount = (recapStats || []).length;
            const averageScore = activeParticipantsCount > 0 ? totalScore / activeParticipantsCount : 1;

            for (const viewer of lobby.viewers) {
              const user = await prisma.user.findUnique({
                where: { id: viewer.userId },
                include: { characters: true, items: true }
              });

              if (user) {
                const activeClass = resolveActiveClass(user);
                const character = user.characters.find((c: any) => c.class === activeClass);
                if (character) {
                  // Find this player's contribution
                  const playerStat = (recapStats || []).find((stat: any) => stat.userId === viewer.userId);
                  const playerScore = playerStat?.score || 0;
                  const scoreRatio = averageScore > 0 ? playerScore / averageScore : 1;

                  // Contribution multiplier: 50% floor, 150% cap, using Math.sqrt
                  const contributionMult = 0.5 + 0.5 * Math.min(2.0, Math.sqrt(scoreRatio));

                  const xpGained = Math.round(bossLevel * 200 * contributionMult);
                  const goldGained = Math.round(bossLevel * 45 * contributionMult);

                  // Check inventory
                  const unequippedCount = await prisma.item.count({
                    where: {
                      userId: user.id,
                      isEquipped: false
                    }
                  });

                  let itemDropped = null;
                  let inventoryFull = false;

                  if (unequippedCount >= 30) {
                    inventoryFull = true;
                  } else {
                    const rollDrop = Math.random();
                    if (rollDrop < contributionMult) {
                      const rarityRoll = Math.random();
                      let rarity: 'RARE' | 'EPIC' | 'LEGENDARY' = 'RARE';

                      if (bossLevel >= 15) {
                        if (rarityRoll < 0.05) rarity = 'LEGENDARY';
                        else if (rarityRoll < 0.25) rarity = 'EPIC';
                        else rarity = 'RARE';
                      } else if (bossLevel >= 10) {
                        if (rarityRoll < 0.15) rarity = 'EPIC';
                        else rarity = 'RARE';
                      } else {
                        rarity = 'RARE';
                      }

                      const slots: Array<'WEAPON' | 'ARMOR' | 'ACCESSORY'> = ['WEAPON', 'ARMOR', 'ACCESSORY'];
                      const slot = slots[Math.floor(Math.random() * slots.length)];

                      const generated = generateRandomItem(bossLevel, rarity, slot, character.class);

                      const dbItem = await prisma.item.create({
                        data: {
                          userId: user.id, // Save directly to User backpack
                          name: generated.name,
                          slot: generated.slot,
                          rarity: generated.rarity,
                          itemLevel: generated.itemLevel,
                          baseAttack: generated.baseAttack,
                          baseDefense: generated.baseDefense,
                          affixes: JSON.stringify(generated.affixes),
                          isEquipped: false
                        }
                      });
                      itemDropped = dbItem;
                    }
                  }

                  // Add XP/Level to active character
                  let newXp = character.xp + xpGained;
                  let newLevel = character.level;
                  let xpNeeded = xpToNextLevel(newLevel);

                  while (newXp >= xpNeeded && newLevel < 100) {
                    newXp -= xpNeeded;
                    newLevel += 1;
                    xpNeeded = xpToNextLevel(newLevel);
                  }
                  if (newLevel >= 100) {
                    newLevel = 100;
                    newXp = 0;
                  }

                  await prisma.character.update({
                    where: { id: character.id },
                    data: {
                      level: newLevel,
                      xp: newXp
                    }
                  });

                  // Add Gold to User profile
                  await prisma.user.update({
                    where: { id: user.id },
                    data: {
                      gold: user.gold + goldGained
                    }
                  });

                  // Refetch full User structure
                  const updatedUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: { characters: true, items: true }
                  });

                  if (updatedUser) {
                    // Update in-memory lobby viewers for subsequent raids in the same lobby session
                    const weapon = updatedUser.items.find((i: any) => i.slot === 'WEAPON' && i.isEquipped && i.equippedCharacterId === character.id);
                    const armor = updatedUser.items.find((i: any) => i.slot === 'ARMOR' && i.isEquipped && i.equippedCharacterId === character.id);

                    const charStats = calculateCharacterStats(
                      character.class,
                      newLevel,
                      JSON.parse(character.talents || '[]'),
                      JSON.parse(character.passives || '[]'),
                      updatedUser.items.filter((i: any) => i.isEquipped && i.equippedCharacterId === character.id) as any
                    );

                    const updatedViewerData: LobbyViewer = {
                      userId: updatedUser.id,
                      username: updatedUser.username,
                      displayName: updatedUser.displayName,
                      charClass: character.class,
                      level: newLevel,
                      weaponRarity: weapon ? weapon.rarity : 'COMMON',
                      armorRarity: armor ? armor.rarity : 'COMMON',
                      maxHp: charStats.maxHp,
                      attackPower: charStats.attackPower,
                      defense: charStats.defense,
                      critChance: charStats.critChance,
                      critMult: charStats.critMult,
                      atkSpeed: charStats.atkSpeed,
                      lifesteal: charStats.lifesteal,
                      reflect: charStats.reflect,
                      cdr: charStats.cdr,
                      speed: charStats.moveSpeed,
                      selectedTalents: JSON.parse(character.talents || '[]'),
                      fireRes: charStats.fireRes,
                      coldRes: charStats.coldRes,
                      poisonRes: charStats.poisonRes,
                      physRes: charStats.physRes
                    };

                    const vIdx = lobby.viewers.findIndex(v => v.userId === viewer.userId);
                    if (vIdx !== -1) {
                      lobby.viewers[vIdx] = updatedViewerData;
                    }

                    // Emit to the user's private socket room to update their client state in real-time
                    const activeChar = getActiveCharacter(updatedUser);
                    io.to(`user_${user.id}`).emit('character-updated', activeChar);
                  }

                  rewards[viewer.userId] = {
                    xp: xpGained,
                    gold: goldGained,
                    itemDropped,
                    inventoryFull
                  };
                }
              }
            }
          }
        } catch (err) {
          console.error('Error resolving raid end rewards:', err);
        } finally {
          io.to(roomName).emit('raid-ended', { success, rewards, recapStats });
          io.to(roomName).emit('lobby-update', lobby);
          io.emit('global-lobbies-update', Object.values(activeLobbies));
        }
      }
    });

    // STREAMER: CLOSE LOBBY
    socket.on('close-lobby', ({ streamerName }) => {
      const roomName = `lobby_${streamerName.toLowerCase()}`;
      delete activeLobbies[streamerName.toLowerCase()];
      io.to(roomName).emit('lobby-closed');
      io.emit('global-lobbies-update', Object.values(activeLobbies));

      const streamerKey = streamerName.toLowerCase();
      if (twitchClients[streamerKey]) {
        twitchClients[streamerKey].disconnect().catch(err => {
          console.error(`Error disconnecting Twitch client for ${streamerName}:`, err);
        });
        delete twitchClients[streamerKey];
      }
    });

    // SOCKET DISCONNECT / CLEANUP
    socket.on('disconnect', () => {
      if (isStreamer && currentLobby) {
        const streamerName = currentLobby.replace('lobby_', '');
        delete activeLobbies[streamerName];
        io.to(currentLobby).emit('lobby-closed');
        io.emit('global-lobbies-update', Object.values(activeLobbies));

        if (twitchClients[streamerName]) {
          twitchClients[streamerName].disconnect().catch(err => {
            console.error(`Error disconnecting Twitch client for ${streamerName}:`, err);
          });
          delete twitchClients[streamerName];
        }
      } else if (currentLobby && connectedUserId) {
        const streamerName = currentLobby.replace('lobby_', '');
        const lobby = activeLobbies[streamerName];
        if (lobby) {
          lobby.viewers = lobby.viewers.filter(v => v.userId !== connectedUserId);
          io.to(currentLobby).emit('lobby-update', lobby);
          io.emit('global-lobbies-update', Object.values(activeLobbies));
        }
      }
    });
  });
};
