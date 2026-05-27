import { Server, Socket } from 'socket.io';
import { prisma } from '../db';
import { generateRandomItem, xpToNextLevel, calculateCharacterStats } from 'shared';
import { resolveActiveClass } from '../routes/auth';

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

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    let currentLobby: string | null = null;
    let isStreamer = false;
    let connectedUserId: string | null = null;

    // STREAMER: CREATE LOBBY
    socket.on('create-lobby', ({ streamerName, bossName, bossLevel }) => {
      const roomName = `lobby_${streamerName.toLowerCase()}`;
      currentLobby = roomName;
      isStreamer = true;

      socket.join(roomName);

      activeLobbies[streamerName.toLowerCase()] = {
        streamerName,
        viewers: [],
        status: 'LOBBY',
        bossName: bossName || 'Beholder of Neon',
        bossLevel: bossLevel || 5
      };

      io.to(roomName).emit('lobby-update', activeLobbies[streamerName.toLowerCase()]);
      io.emit('global-lobbies-update', Object.values(activeLobbies)); // Alert everyone of new lobby
    });

    // VIEWER/STREAMER: JOIN LOBBY
    socket.on('join-lobby', async ({ streamerName, userId, username, displayName }) => {
      connectedUserId = userId;
      const streamerKey = streamerName.toLowerCase();
      const roomName = `lobby_${streamerKey}`;
      currentLobby = roomName;

      socket.join(roomName);

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

            // Enforce 30 player cap
            const alreadyJoined = lobby.viewers.some(v => v.userId === userId);
            if (!alreadyJoined && lobby.viewers.length >= 30) {
              socket.emit('lobby-error', { error: 'Lobby is full! Max 30 players.' });
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
      if (message.trim().toLowerCase() === '!join') {
        const lobby = activeLobbies[streamerKey];
        if (lobby && lobby.status === 'LOBBY') {
          try {
            // Find or create the viewer profile in DB
            const viewerTwitchId = `sim_twitch_${senderName.toLowerCase()}`;
            let user = await prisma.user.findUnique({
              where: { twitchId: viewerTwitchId },
              include: { characters: true, items: true }
            });

            if (!user) {
              const startClass = ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'][Math.floor(Math.random() * 5)];
              user = await prisma.user.create({
                data: {
                  twitchId: viewerTwitchId,
                  username: senderName.toLowerCase(),
                  displayName: senderName,
                  gold: 50,
                  activeClass: startClass,
                  characters: {
                    create: {
                      class: startClass,
                      level: Math.floor(Math.random() * 3) + 1, // Start level 1-3
                      xp: 0,
                      talents: '[]',
                      passives: '["start"]'
                    }
                  }
                },
                include: { characters: true, items: true }
              });

              // Starter items for new class
              const simChar = user.characters[0];
              const weaponName = 
                startClass === 'WARRIOR' ? 'Rusty Gladius' :
                startClass === 'MAGE' ? 'Initiate Wand' :
                startClass === 'CLERIC' ? 'Novice Scepter' :
                startClass === 'ROGUE' ? 'Serrated Dirk' : 'Trimming Bow';

              const armorName =
                startClass === 'WARRIOR' ? 'Tattered Mail' :
                startClass === 'MAGE' ? 'Apprentice Robe' :
                startClass === 'CLERIC' ? 'Acolyte Vestment' :
                startClass === 'ROGUE' ? 'Scout Leather' : 'Scout Leather';

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

              // Refetch simulated user
              user = await prisma.user.findUnique({
                where: { id: user.id },
                include: { characters: true, items: true }
              }) as any;
            }

            const activeClass = resolveActiveClass(user);
            const char = user!.characters.find(c => c.class === activeClass);
            if (char) {
              const weapon = user!.items.find(i => i.slot === 'WEAPON' && i.isEquipped && i.equippedCharacterId === char.id);
              const armor = user!.items.find(i => i.slot === 'ARMOR' && i.isEquipped && i.equippedCharacterId === char.id);

              const charStats = calculateCharacterStats(
                char.class,
                char.level,
                JSON.parse(char.talents || '[]'),
                JSON.parse(char.passives || '[]'),
                user!.items.filter(i => i.isEquipped && i.equippedCharacterId === char.id) as any
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

              // Enforce 30 player cap
              const alreadyJoined = lobby.viewers.some(v => v.userId === user!.id);
              if (!alreadyJoined && lobby.viewers.length >= 30) {
                io.to(roomName).emit('chat-log-received', {
                  sender: 'SYSTEM',
                  message: `@${senderName}, the raid is full! Max 30 players.`,
                  timestamp: Date.now()
                });
                return;
              }

              lobby.viewers = lobby.viewers.filter(v => v.userId !== user!.id);
              lobby.viewers.push(viewerData);

              io.to(roomName).emit('lobby-update', lobby);
              io.emit('global-lobbies-update', Object.values(activeLobbies));
            }
          } catch (err) {
            console.error('Error handling simulated chat join:', err);
          }
        }
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
          const rewards: Record<string, { xp: number; gold: number; itemDropped?: any; inventoryFull?: boolean }> = {};

          if (success) {
            for (const viewer of lobby.viewers) {
              const user = await prisma.user.findUnique({
                where: { id: viewer.userId },
                include: { characters: true, items: true }
              });

              if (user) {
                const activeClass = resolveActiveClass(user);
                const character = user.characters.find(c => c.class === activeClass);
                if (character) {
                  const xpGained = bossLevel * 80;
                  const goldGained = bossLevel * 15;

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

          io.to(roomName).emit('raid-ended', { success, rewards, recapStats });
          io.to(roomName).emit('lobby-update', lobby);
          io.emit('global-lobbies-update', Object.values(activeLobbies));
        } catch (err) {
          console.error('Error resolving raid end rewards:', err);
        }
      }
    });

    // STREAMER: CLOSE LOBBY
    socket.on('close-lobby', ({ streamerName }) => {
      const roomName = `lobby_${streamerName.toLowerCase()}`;
      delete activeLobbies[streamerName.toLowerCase()];
      io.to(roomName).emit('lobby-closed');
      io.emit('global-lobbies-update', Object.values(activeLobbies));
    });

    // SOCKET DISCONNECT / CLEANUP
    socket.on('disconnect', () => {
      if (isStreamer && currentLobby) {
        const streamerName = currentLobby.replace('lobby_', '');
        delete activeLobbies[streamerName];
        io.to(currentLobby).emit('lobby-closed');
        io.emit('global-lobbies-update', Object.values(activeLobbies));
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
