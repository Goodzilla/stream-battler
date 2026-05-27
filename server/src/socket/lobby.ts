import { Server, Socket } from 'socket.io';
import { prisma } from '../db';
import { generateRandomItem, xpToNextLevel } from '../game/formulas';

export interface LobbyViewer {
  userId: string;
  username: string;
  displayName: string;
  charClass: string;
  level: number;
  weaponRarity: string;
  armorRarity: string;
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
      const streamerKey = streamerName.toLowerCase();
      const roomName = `lobby_${streamerKey}`;
      currentLobby = roomName;

      socket.join(roomName);

      const lobby = activeLobbies[streamerKey];
      if (lobby) {
        // Find player's character in DB
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { character: { include: { items: true } } }
        });

        if (user && user.character) {
          const char = user.character;
          const weapon = char.items.find(i => i.slot === 'WEAPON' && i.isEquipped);
          const armor = char.items.find(i => i.slot === 'ARMOR' && i.isEquipped);

          const viewerData: LobbyViewer = {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            charClass: char.class,
            level: char.level,
            weaponRarity: weapon ? weapon.rarity : 'COMMON',
            armorRarity: armor ? armor.rarity : 'COMMON'
          };

          // Deduplicate viewers
          lobby.viewers = lobby.viewers.filter(v => v.userId !== userId);
          lobby.viewers.push(viewerData);

          io.to(roomName).emit('lobby-update', lobby);
          io.emit('global-lobbies-update', Object.values(activeLobbies));
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
              include: { character: { include: { items: true } } }
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  twitchId: viewerTwitchId,
                  username: senderName.toLowerCase(),
                  displayName: senderName,
                  character: {
                    create: {
                      class: ['WARRIOR', 'MAGE', 'CLERIC', 'ROGUE', 'RANGER'][Math.floor(Math.random() * 5)],
                      level: Math.floor(Math.random() * 3) + 1, // Start level 1-3
                      xp: 0,
                      gold: 50,
                      talents: '[]',
                      passives: '["start"]'
                    }
                  }
                },
                include: { character: { include: { items: true } } }
              });
            }

            const char = user.character!;
            const weapon = char.items.find(i => i.slot === 'WEAPON' && i.isEquipped);
            const armor = char.items.find(i => i.slot === 'ARMOR' && i.isEquipped);

            const viewerData: LobbyViewer = {
              userId: user.id,
              username: user.username,
              displayName: user.displayName,
              charClass: char.class,
              level: char.level,
              weaponRarity: weapon ? weapon.rarity : 'COMMON',
              armorRarity: armor ? armor.rarity : 'COMMON'
            };

            lobby.viewers = lobby.viewers.filter(v => v.userId !== user!.id);
            lobby.viewers.push(viewerData);

            io.to(roomName).emit('lobby-update', lobby);
            io.emit('global-lobbies-update', Object.values(activeLobbies));
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

    // STREAMER: BROADCAST COMBAT STATE SNAPSHOTS (Runs at 10-20 FPS)
    socket.on('streamer-state-update', ({ streamerName, snapshot }) => {
      const roomName = `lobby_${streamerName.toLowerCase()}`;
      // Relay physics positions/health directly to viewers in the room (excludes streamer who sent it)
      socket.to(roomName).emit('raid-state-broadcast', snapshot);
    });

    // STREAMER: END RAID (VICTORY / DEFEAT)
    socket.on('streamer-raid-end', async ({ streamerName, success, bossName, bossLevel }) => {
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
          const rewards: Record<string, { xp: number; gold: number; itemDropped?: any }> = {};

          if (success) {
            for (const viewer of lobby.viewers) {
              const character = await prisma.character.findUnique({
                where: { userId: viewer.userId },
                include: { items: true }
              });

              if (character) {
                // Better rewards than solo grinding!
                const xpGained = bossLevel * 80;
                const goldGained = bossLevel * 40;

                // Roll loot
                let itemDropped = null;
                const lootRoll = Math.random();

                // 25% chance of loot drop, and can drop LEGENDARIES!
                if (lootRoll < 0.25) {
                  // Roll rarity
                  const rarityRoll = Math.random();
                  let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' = 'UNCOMMON';

                  if (rarityRoll < 0.05) rarity = 'LEGENDARY'; // 5% of loot is Legendary
                  else if (rarityRoll < 0.20) rarity = 'EPIC';
                  else if (rarityRoll < 0.50) rarity = 'RARE';

                  // Roll slot
                  const slots: Array<'WEAPON' | 'ARMOR' | 'ACCESSORY'> = ['WEAPON', 'ARMOR', 'ACCESSORY'];
                  const slot = slots[Math.floor(Math.random() * slots.length)];

                  const generated = generateRandomItem(bossLevel, rarity, slot, character.class);

                  // Save to DB
                  const dbItem = await prisma.item.create({
                    data: {
                      characterId: character.id,
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

                // Add XP/Gold to character
                let newXp = character.xp + xpGained;
                let newLevel = character.level;
                let xpNeeded = xpToNextLevel(newLevel);

                while (newXp >= xpNeeded) {
                  newXp -= xpNeeded;
                  newLevel += 1;
                  xpNeeded = xpToNextLevel(newLevel);
                }

                await prisma.character.update({
                  where: { id: character.id },
                  data: {
                    level: newLevel,
                    xp: newXp,
                    gold: character.gold + goldGained
                  }
                });

                rewards[viewer.userId] = {
                  xp: xpGained,
                  gold: goldGained,
                  itemDropped
                };
              }
            }
          }

          io.to(roomName).emit('raid-ended', { success, rewards });
          io.to(roomName).emit('lobby-update', lobby);
          io.emit('global-lobbies-update', Object.values(activeLobbies));
        } catch (err) {
          console.error('Error resolving raid end rewards:', err);
        }
      }
    });

    // SOCKET DISCONNECT / CLEANUP
    socket.on('disconnect', () => {
      if (isStreamer && currentLobby) {
        // If streamer leaves, destroy lobby
        const streamerName = currentLobby.replace('lobby_', '');
        delete activeLobbies[streamerName];
        io.emit('global-lobbies-update', Object.values(activeLobbies));
      } else if (currentLobby) {
        // Viewer leaves lobby
        const streamerName = currentLobby.replace('lobby_', '');
        const lobby = activeLobbies[streamerName];
        if (lobby) {
          lobby.viewers = lobby.viewers.filter(v => `lobby_${streamerName}` !== currentLobby); // Simple check, clean up based on viewer connections
          io.to(currentLobby).emit('lobby-update', lobby);
        }
      }
    });
  });
};
