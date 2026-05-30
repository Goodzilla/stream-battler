import { Server, Socket } from 'socket.io';
import { prisma } from '../db';
import { generateRandomItem, xpToNextLevel, calculateCharacterStats } from 'shared';
import { resolveActiveClass, getActiveCharacter } from '../routes/auth';
import { randomUUID } from 'crypto';
import { syncUserUpdate } from './lobby';

export interface WildernessMonster {
  id: string;
  name: string;
  spriteType: string;
  color: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  attackPower: number;
  atkSpeed: number;
  attackRange: number;
  level: number;
  xp: number;
  gold: number;
  atkTimer: number;
}

export interface WildernessPlayer {
  userId: string;
  username: string;
  displayName: string;
  charClass: string;
  level: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  color: string;
  speed: number;
  attackPower: number;
  defense: number;
  atkSpeed: number;
  attackRange: number;
  reflect: number;
  lifesteal: number;
  selectedTalents: string[];
}

export interface WildernessState {
  players: Record<string, WildernessPlayer>;
  monsters: WildernessMonster[];
}

export const activeWilderness: WildernessState = {
  players: {},
  monsters: []
};

// Global online tracking registry
// socketId -> RosterInfo
export const onlineUsers: Record<string, {
  userId: string;
  username: string;
  displayName: string;
  charClass: string;
  level: number;
  location: string;
}> = {};

export function getUniqueOnlineList() {
  const list = Object.values(onlineUsers);
  const unique: Record<string, typeof list[0]> = {};
  list.forEach(u => {
    unique[u.userId] = u;
  });
  return Object.values(unique);
}

const MONSTER_TEMPLATES = [
  { name: 'Grid Slime', spriteType: 'GOBLIN_SCOUT', color: '#39ff14', attackPower: 5, defense: 1, maxHp: 50, attackRange: 35, speed: 45, xp: 25, gold: 4, level: 3 },
  { name: 'Cyber Rogue', spriteType: 'FERAL_GOBLIN', color: '#ff3b30', attackPower: 9, defense: 2, maxHp: 80, attackRange: 40, speed: 65, xp: 45, gold: 7, level: 6 },
  { name: 'Neon Viper', spriteType: 'NEON_VIPER', color: '#ff007f', attackPower: 12, defense: 2, maxHp: 70, attackRange: 45, speed: 75, xp: 55, gold: 9, level: 9 },
  { name: 'Cyber Zombie', spriteType: 'SKELETAL_GRUNT', color: '#a020f0', attackPower: 15, defense: 5, maxHp: 130, attackRange: 40, speed: 38, xp: 85, gold: 13, level: 12 },
  { name: 'Laser Hatchling', spriteType: 'VOLCANO_HATCHLING', color: '#ff9500', attackPower: 22, defense: 4, maxHp: 190, attackRange: 150, speed: 50, xp: 160, gold: 28, level: 18 },
  { name: 'Void Guardian', spriteType: 'ORC_BERSERKER', color: '#00ffff', attackPower: 28, defense: 8, maxHp: 280, attackRange: 50, speed: 45, xp: 250, gold: 45, level: 25 },
];

let mmoLoopInterval: NodeJS.Timeout | null = null;
let lastBossSpawnTime = Date.now();

const spawnMonster = () => {
  const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
  const monsterId = `monster_${randomUUID()}`;
  const x = 400 + Math.random() * 700;
  const y = 100 + Math.random() * 400;

  activeWilderness.monsters.push({
    id: monsterId,
    name: template.name,
    spriteType: template.spriteType,
    color: template.color,
    x,
    y,
    hp: template.maxHp,
    maxHp: template.maxHp,
    speed: template.speed,
    attackPower: template.attackPower,
    atkSpeed: 1.0,
    attackRange: template.attackRange,
    level: template.level,
    xp: template.xp,
    gold: template.gold,
    atkTimer: 0
  });
};

const spawnWorldBoss = (io: Server) => {
  const bossId = `monster_boss_${randomUUID()}`;
  const x = 700 + Math.random() * 100;
  const y = 250 + Math.random() * 100;
  
  const boss = {
    id: bossId,
    name: '⚡ WORLD BOSS: INFERNO DRAGON ⚡',
    spriteType: 'INFERNO_DRAGON',
    color: '#ff453a',
    x,
    y,
    hp: 2500,
    maxHp: 2500,
    speed: 40,
    attackPower: 45,
    atkSpeed: 0.8,
    attackRange: 200,
    level: 40,
    xp: 1500,
    gold: 250,
    atkTimer: 0
  };

  activeWilderness.monsters.push(boss);

  io.emit('chat-message-received', {
    sender: 'SYSTEM',
    message: '⚠️ A level 40 WORLD BOSS [INFERNO DRAGON] has spawned in the Neon Wilderness! Assemble all units! ⚠️',
    timestamp: Date.now()
  });
};

const startWildernessLoop = (io: Server) => {
  if (mmoLoopInterval) return;
  
  let lastTime = Date.now();
  mmoLoopInterval = setInterval(() => {
    const now = Date.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    const playersCount = Object.keys(activeWilderness.players).length;
    if (playersCount === 0) {
      clearInterval(mmoLoopInterval!);
      mmoLoopInterval = null;
      activeWilderness.monsters = [];
      return;
    }

    // 1. Maintain monster population
    const targetMonsterCount = Math.min(12, 4 + playersCount * 2);
    if (activeWilderness.monsters.length < targetMonsterCount) {
      spawnMonster();
    }

    // 2. Check World Boss spawn (every 3 minutes, if none active)
    if (now - lastBossSpawnTime > 180000) {
      const bossActive = activeWilderness.monsters.some(m => m.name.includes('BOSS'));
      if (!bossActive) {
        spawnWorldBoss(io);
      }
      lastBossSpawnTime = now;
    }

    // 3. Move monsters towards nearest living player
    activeWilderness.monsters.forEach(monster => {
      let targetPlayer: WildernessPlayer | null = null;
      let minDist = 99999;
      
      Object.values(activeWilderness.players).forEach(p => {
        if (p.hp <= 0) return; // Skip dead players
        const dx = p.x - monster.x;
        const dy = p.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          targetPlayer = p;
        }
      });

      if (targetPlayer) {
        const tp = targetPlayer as WildernessPlayer;
        const dx = tp.x - monster.x;
        const dy = tp.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > monster.attackRange) {
          const angle = Math.atan2(dy, dx);
          monster.x += Math.cos(angle) * monster.speed * dt;
          monster.y += Math.sin(angle) * monster.speed * dt;
        }
      }
    });

    // 4. Broadcast state updates
    io.to('neon_wilderness').emit('wilderness-update', {
      players: Object.values(activeWilderness.players),
      monsters: activeWilderness.monsters
    });

  }, 100); // 10Hz tick
};

export const setupMmoHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    let currentSocketUser: { userId: string; username: string } | null = null;

    // A. REGISTER SOCKET TO ONLINE ROSTER
    socket.on('register-active-user', async ({ userId, username, displayName, charClass, level, location }) => {
      currentSocketUser = { userId, username };
      onlineUsers[socket.id] = {
        userId,
        username,
        displayName,
        charClass,
        level,
        location: location || 'Town'
      };

      io.emit('online-players-update', getUniqueOnlineList());
    });

    // B. UPDATE LOCATION (e.g. Town -> Arena -> Wilderness)
    socket.on('update-user-location', ({ location }) => {
      if (onlineUsers[socket.id]) {
        onlineUsers[socket.id].location = location;
        io.emit('online-players-update', getUniqueOnlineList());
      }
    });

    // C. JOIN WILDERNESS ROOM
    socket.on('join-wilderness', async ({ userId }) => {
      socket.join('neon_wilderness');

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { characters: true, items: true }
        });

        if (user) {
          const activeClass = resolveActiveClass(user);
          const char = user.characters.find(c => c.class === activeClass);

          if (char) {
            const charStats = calculateCharacterStats(
              char.class,
              char.level,
              JSON.parse(char.talents || '[]'),
              JSON.parse(char.passives || '[]'),
              user.items.filter(i => i.isEquipped && i.equippedCharacterId === char.id) as any
            );

            // Add player to active wilderness state
            activeWilderness.players[userId] = {
              userId: user.id,
              username: user.username,
              displayName: user.displayName,
              charClass: char.class,
              level: char.level,
              x: 100 + Math.random() * 100, // Spawn on the left
              y: 150 + Math.random() * 300,
              hp: charStats.maxHp,
              maxHp: charStats.maxHp,
              color: char.class === 'WARRIOR' ? '#3b82f6' : (char.class === 'MAGE' ? '#a855f7' : (char.class === 'CLERIC' ? '#eab308' : (char.class === 'ROGUE' ? '#ef4444' : '#22c55e'))),
              speed: charStats.moveSpeed,
              attackPower: charStats.attackPower,
              defense: charStats.defense,
              atkSpeed: charStats.atkSpeed,
              attackRange: char.class === 'RANGER' ? 220 : (char.class === 'MAGE' ? 180 : 40),
              reflect: charStats.reflect,
              lifesteal: charStats.lifesteal,
              selectedTalents: JSON.parse(char.talents || '[]')
            };

            // Start the wilderness loop if it's the first player
            startWildernessLoop(io);

            // Notify room of player arrival
            socket.to('neon_wilderness').emit('wilderness-chat-announcement', {
              message: `${user.displayName} has entered the Neon Wilderness.`,
              color: '#39ff14'
            });

            // Send current list immediately
            socket.emit('wilderness-init', {
              players: Object.values(activeWilderness.players),
              monsters: activeWilderness.monsters
            });
          }
        }
      } catch (err) {
        console.error('Error joining wilderness:', err);
      }
    });

    // D. LEAVE WILDERNESS ROOM
    socket.on('leave-wilderness', ({ userId }) => {
      socket.leave('neon_wilderness');
      if (activeWilderness.players[userId]) {
        delete activeWilderness.players[userId];
        socket.to('neon_wilderness').emit('wilderness-chat-announcement', {
          message: `${currentSocketUser?.username || 'A player'} has returned to town.`,
          color: '#ff9500'
        });
      }
    });

    // E. SYNC PLAYER COORDINATES AND STATE
    socket.on('sync-wilderness-player', ({ userId, x, y, hp, maxHp }) => {
      const p = activeWilderness.players[userId];
      if (p) {
        p.x = x;
        p.y = y;
        p.hp = hp;
        p.maxHp = maxHp;

        // Broadcast to other players in Wilderness room
        socket.to('neon_wilderness').emit('wilderness-player-synced', {
          userId,
          x,
          y,
          hp,
          maxHp
        });
      }
    });

    // F. RELAY PLAYER DAMAGED (WHEN ENEMY HITS PLAYER)
    socket.on('wilderness-player-damaged', ({ userId, damage, newHp }) => {
      const p = activeWilderness.players[userId];
      if (p) {
        p.hp = newHp;
        socket.to('neon_wilderness').emit('wilderness-player-damaged-sync', {
          userId,
          damage,
          newHp
        });
      }
    });

    // G. RELAY PLAYER HEALED (WHEN CLERIC HEALS PLAYER)
    socket.on('wilderness-player-healed', ({ targetUserId, healerUserId, amount, newHp }) => {
      const target = activeWilderness.players[targetUserId];
      if (target) {
        target.hp = newHp;
        socket.to('neon_wilderness').emit('wilderness-player-healed-sync', {
          targetUserId,
          healerUserId,
          amount,
          newHp
        });
      }
    });

    // H. MONSTER ATTACK AND HIT (DAMAGE DEALT BY PLAYERS)
    socket.on('damage-monster', async ({ userId, monsterId, damage, isCrit }) => {
      const monster = activeWilderness.monsters.find(m => m.id === monsterId);
      if (!monster) return;

      monster.hp = Math.max(0, monster.hp - damage);

      // Broadcast attack visuals to all players in wilderness
      io.to('neon_wilderness').emit('monster-damaged-sync', {
        monsterId,
        hp: monster.hp,
        damage,
        isCrit,
        attackerId: userId
      });

      // Handle monster death
      if (monster.hp <= 0) {
        activeWilderness.monsters = activeWilderness.monsters.filter(m => m.id !== monsterId);
        
        // Broadcast death event
        io.to('neon_wilderness').emit('monster-died-sync', {
          monsterId,
          monsterName: monster.name
        });

        // Award shared rewards to all active players in the wilderness!
        const participatingUserIds = Object.keys(activeWilderness.players);
        for (const pId of participatingUserIds) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: pId },
              include: { characters: true, items: true }
            });

            if (dbUser) {
              const activeClass = resolveActiveClass(dbUser);
              const character = dbUser.characters.find(c => c.class === activeClass);

              if (character) {
                // Scale XP and Gold by monster level
                const xpGained = Math.round(monster.xp * (0.8 + Math.random() * 0.4));
                const goldGained = Math.round(monster.gold * (0.8 + Math.random() * 0.4));

                // XP Level-up logic
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

                // Check loot item drop
                let itemDropped: any = null;
                let inventoryFull = false;

                // Base drop: 6% for regular, 80% for world boss
                const dropRoll = Math.random();
                const dropChance = monster.name.includes('BOSS') ? 0.8 : 0.06;
                
                if (dropRoll < dropChance) {
                  const unequippedCount = dbUser.items.filter(i => !i.isEquipped).length;
                  if (unequippedCount >= 30) {
                    inventoryFull = true;
                  } else {
                    const rarityRoll = Math.random();
                    let rarity: 'RARE' | 'EPIC' | 'LEGENDARY' = 'RARE';
                    if (monster.level >= 25) {
                      if (rarityRoll < 0.08) rarity = 'LEGENDARY';
                      else if (rarityRoll < 0.35) rarity = 'EPIC';
                    } else if (monster.level >= 10) {
                      if (rarityRoll < 0.15) rarity = 'EPIC';
                    }

                    const slots: Array<'WEAPON' | 'ARMOR' | 'ACCESSORY'> = ['WEAPON', 'ARMOR', 'ACCESSORY'];
                    const slot = slots[Math.floor(Math.random() * slots.length)];
                    const generated = generateRandomItem(monster.level, rarity, slot, character.class);

                    itemDropped = await prisma.item.create({
                      data: {
                        userId: dbUser.id,
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
                  }
                }

                // Apply DB updates
                await prisma.character.update({
                  where: { id: character.id },
                  data: { level: newLevel, xp: newXp }
                });

                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: { gold: dbUser.gold + goldGained }
                });

                // Sync across user's open sockets (tabs)
                await syncUserUpdate(dbUser.id);

                // Notify specific user socket of reward details
                io.to(`user_${dbUser.id}`).emit('wilderness-loot-reward', {
                  monsterName: monster.name,
                  xpGained,
                  goldGained,
                  itemDropped,
                  inventoryFull
                });
              }
            }
          } catch (err) {
            console.error(`Error rewarding player ${pId} in wilderness:`, err);
          }
        }
      }
    });

    // I. GLOBAL REAL-TIME CHAT ROUTER
    socket.on('send-global-chat', ({ message }) => {
      const rosterInfo = onlineUsers[socket.id];
      if (!rosterInfo) return;

      const chatPayload = {
        id: `chat_${randomUUID()}`,
        sender: rosterInfo.displayName,
        charClass: rosterInfo.charClass,
        level: rosterInfo.level,
        message,
        timestamp: Date.now()
      };

      io.emit('chat-message-received', chatPayload);
    });

    // J. CLEANUP DISCONNECTS
    socket.on('disconnect', () => {
      if (onlineUsers[socket.id]) {
        const u = onlineUsers[socket.id];
        
        // Remove from wilderness if inside
        if (activeWilderness.players[u.userId]) {
          delete activeWilderness.players[u.userId];
          socket.to('neon_wilderness').emit('wilderness-chat-announcement', {
            message: `${u.displayName} has disconnected.`,
            color: '#ff3b30'
          });
        }

        delete onlineUsers[socket.id];
        io.emit('online-players-update', getUniqueOnlineList());
      }
    });
  });
};
