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

export interface WildernessSession {
  userId: string;
  username: string;
  displayName: string;
  charClass: string;
  xpAccumulated: number;
  goldAccumulated: number;
  itemsAccumulated: any[];
  damageDealt: number;
  healingDone: number;
  joinedAt: number;
}

export interface WildernessState {
  players: Record<string, WildernessPlayer>;
  monsters: WildernessMonster[];
  sessions: Record<string, WildernessSession>;
  zoneStartTime: number;
}

export const activeWilderness: WildernessState = {
  players: {},
  monsters: [],
  sessions: {},
  zoneStartTime: 0
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

const spawnMonster = (avgPlayerLevel: number, levelOffset: number, difficultyMult: number) => {
  const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
  const monsterId = `monster_${randomUUID()}`;
  const x = 400 + Math.random() * 700;
  const y = 100 + Math.random() * 400;

  const scaledLevel = Math.max(1, Math.round(avgPlayerLevel * 0.85) + levelOffset + Math.floor(Math.random() * 3));
  const maxHp = Math.round(template.maxHp * (0.5 + scaledLevel * 0.08) * difficultyMult);
  const attackPower = Math.round(template.attackPower * (0.6 + scaledLevel * 0.06) * difficultyMult);
  const xp = Math.round(template.xp * (0.7 + scaledLevel * 0.05) * Math.sqrt(difficultyMult));
  const gold = Math.round(template.gold * (0.7 + scaledLevel * 0.05) * Math.sqrt(difficultyMult));

  activeWilderness.monsters.push({
    id: monsterId,
    name: `${template.name} (Lvl ${scaledLevel})`,
    spriteType: template.spriteType,
    color: template.color,
    x,
    y,
    hp: maxHp,
    maxHp,
    speed: template.speed,
    attackPower,
    atkSpeed: 1.0,
    attackRange: template.attackRange,
    level: scaledLevel,
    xp,
    gold,
    atkTimer: 0
  });
};

const spawnWorldBoss = (io: Server, avgPlayerLevel: number, levelOffset: number, difficultyMult: number) => {
  const bossId = `monster_boss_${randomUUID()}`;
  const x = 700 + Math.random() * 100;
  const y = 250 + Math.random() * 100;
  
  const scaledLevel = Math.max(30, avgPlayerLevel + 10 + levelOffset);
  const maxHp = Math.round(2500 * (0.5 + scaledLevel * 0.05) * difficultyMult);
  const attackPower = Math.round(45 * (0.6 + scaledLevel * 0.04) * difficultyMult);
  const xp = Math.round(1500 * (1.0 + scaledLevel * 0.02) * Math.sqrt(difficultyMult));
  const gold = Math.round(250 * (1.0 + scaledLevel * 0.02) * Math.sqrt(difficultyMult));

  const boss = {
    id: bossId,
    name: `⚡ WORLD BOSS: INFERNO DRAGON (Lvl ${scaledLevel}) ⚡`,
    spriteType: 'INFERNO_DRAGON',
    color: '#ff453a',
    x,
    y,
    hp: maxHp,
    maxHp,
    speed: 40,
    attackPower,
    atkSpeed: 0.8,
    attackRange: 200,
    level: scaledLevel,
    xp,
    gold,
    atkTimer: 0
  };

  activeWilderness.monsters.push(boss);

  io.emit('chat-message-received', {
    sender: 'SYSTEM',
    message: `⚠️ A level ${scaledLevel} WORLD BOSS [INFERNO DRAGON] has spawned in the Neon Wilderness! Assemble all units! ⚠️`,
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
      activeWilderness.zoneStartTime = 0;
      return;
    }

    if (activeWilderness.zoneStartTime === 0) {
      activeWilderness.zoneStartTime = now;
    }

    // Difficulty scaling formulas
    const elapsedMinutes = (now - activeWilderness.zoneStartTime) / 60000;
    const levelOffset = Math.min(15, Math.floor(elapsedMinutes * 1.0)); // max +15 levels
    const difficultyMult = 1.0 + Math.min(1.5, elapsedMinutes * 0.08); // max 2.5x stats

    // Average player level inside Wilderness
    const players = Object.values(activeWilderness.players);
    const avgPlayerLevel = players.length > 0
      ? Math.round(players.reduce((sum, p) => sum + p.level, 0) / players.length)
      : 15;

    // 1. Maintain monster population
    const targetMonsterCount = Math.min(12, 4 + playersCount * 2);
    if (activeWilderness.monsters.length < targetMonsterCount) {
      spawnMonster(avgPlayerLevel, levelOffset, difficultyMult);
    }

    // 2. Check World Boss spawn (every 3 minutes, if none active)
    if (now - lastBossSpawnTime > 180000) {
      const bossActive = activeWilderness.monsters.some(m => m.name.includes('BOSS'));
      if (!bossActive) {
        spawnWorldBoss(io, avgPlayerLevel, levelOffset, difficultyMult);
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

// Database persistence helper for Wilderness accumulated rewards
const commitWildernessSession = async (userId: string) => {
  const session = activeWilderness.sessions[userId];
  if (!session) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { characters: true, items: true }
    });
    if (!user) return;

    const activeClass = resolveActiveClass(user);
    const character = user.characters.find(c => c.class === activeClass);
    if (!character) return;

    const prismaOps: any[] = [];

    // 1. Calculate XP level ups
    let newXp = character.xp + session.xpAccumulated;
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

    prismaOps.push(prisma.character.update({
      where: { id: character.id },
      data: { level: newLevel, xp: newXp }
    }));

    // 2. Grant Gold
    prismaOps.push(prisma.user.update({
      where: { id: userId },
      data: { gold: user.gold + session.goldAccumulated }
    }));

    // 3. Spawn Items
    session.itemsAccumulated.forEach(item => {
      prismaOps.push(prisma.item.create({
        data: {
          id: item.id,
          userId,
          name: item.name,
          slot: item.slot,
          rarity: item.rarity,
          itemLevel: item.itemLevel,
          baseAttack: item.baseAttack,
          baseDefense: item.baseDefense,
          affixes: item.affixes,
          isEquipped: false
        }
      }));
    });

    if (prismaOps.length > 0) {
      await prisma.$transaction(prismaOps);
    }

    // Sync client dashboards
    await syncUserUpdate(userId);

    console.log(`[MMO] Committed session rewards for ${session.displayName}. XP:+${session.xpAccumulated}, Gold:+${session.goldAccumulated}, Items:${session.itemsAccumulated.length}`);
  } catch (err) {
    console.error(`[MMO] Failed to commit Wilderness session for user ${userId}:`, err);
  } finally {
    delete activeWilderness.sessions[userId];
  }
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
              x: 100 + Math.random() * 80, // Spawn near graveyard portal on left
              y: 200 + Math.random() * 200,
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

            // Initialize session buffer
            activeWilderness.sessions[userId] = {
              userId: user.id,
              username: user.username,
              displayName: user.displayName,
              charClass: char.class,
              xpAccumulated: 0,
              goldAccumulated: 0,
              itemsAccumulated: [],
              damageDealt: 0,
              healingDone: 0,
              joinedAt: Date.now()
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

            // Broadcast session update to update sidebar
            io.to('neon_wilderness').emit('wilderness-session-update', Object.values(activeWilderness.sessions));
          }
        }
      } catch (err) {
        console.error('Error joining wilderness:', err);
      }
    });

    // D. LEAVE WILDERNESS ROOM
    socket.on('leave-wilderness', async ({ userId }) => {
      socket.leave('neon_wilderness');
      
      // Save all buffered progress to DB
      await commitWildernessSession(userId);

      if (activeWilderness.players[userId]) {
        delete activeWilderness.players[userId];
        socket.to('neon_wilderness').emit('wilderness-chat-announcement', {
          message: `${currentSocketUser?.username || 'A player'} has returned to town.`,
          color: '#ff9500'
        });
      }

      // Sync active sidebars
      io.to('neon_wilderness').emit('wilderness-session-update', Object.values(activeWilderness.sessions));
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
        
        // Track healing participation in session
        const session = activeWilderness.sessions[healerUserId];
        if (session) {
          session.healingDone += amount;
        }

        socket.to('neon_wilderness').emit('wilderness-player-healed-sync', {
          targetUserId,
          healerUserId,
          amount,
          newHp
        });

        // Broadcast stats changes
        io.to('neon_wilderness').emit('wilderness-session-update', Object.values(activeWilderness.sessions));
      }
    });

    // H. MONSTER ATTACK AND HIT (DAMAGE DEALT BY PLAYERS)
    socket.on('damage-monster', async ({ userId, monsterId, damage, isCrit }) => {
      const monster = activeWilderness.monsters.find(m => m.id === monsterId);
      if (!monster) return;

      monster.hp = Math.max(0, monster.hp - damage);

      // Track damage participation in session
      const activeSession = activeWilderness.sessions[userId];
      if (activeSession) {
        activeSession.damageDealt += damage;
      }

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

        // Award shared rewards in-memory to all active players' sessions
        const participatingUserIds = Object.keys(activeWilderness.players);
        for (const pId of participatingUserIds) {
          try {
            const session = activeWilderness.sessions[pId];
            if (session) {
              const xpGained = Math.round(monster.xp * (0.8 + Math.random() * 0.4));
              const goldGained = Math.round(monster.gold * (0.8 + Math.random() * 0.4));

              session.xpAccumulated += xpGained;
              session.goldAccumulated += goldGained;

              // Roll item drop
              let itemDropped: any = null;
              const dropRoll = Math.random();
              
              const elapsedMinutes = activeWilderness.zoneStartTime > 0 
                ? (Date.now() - activeWilderness.zoneStartTime) / 60000 
                : 0;
              const dropChanceMult = Math.min(1.5, 1.0 + (elapsedMinutes * 0.025));
              const dropChance = (monster.name.includes('BOSS') ? 0.8 : 0.08) * dropChanceMult;
              
              if (dropRoll < dropChance) {
                const dbUser = await prisma.user.findUnique({
                  where: { id: pId },
                  include: { characters: true, items: true }
                });

                if (dbUser) {
                  const activeClass = resolveActiveClass(dbUser);
                  const character = dbUser.characters.find(c => c.class === activeClass);

                  if (character) {
                    const unequippedCount = dbUser.items.filter(i => !i.isEquipped).length + session.itemsAccumulated.length;
                    if (unequippedCount < 30) {
                      const rarityBonus = Math.min(0.15, elapsedMinutes * 0.008);
                      const rarityRoll = Math.random() - rarityBonus;
                      let rarity: 'RARE' | 'EPIC' | 'LEGENDARY' = 'RARE';
                      
                      if (monster.level >= 25 || rarityBonus > 0.08) {
                        if (rarityRoll < 0.12) rarity = 'LEGENDARY';
                        else if (rarityRoll < 0.45) rarity = 'EPIC';
                      } else if (monster.level >= 10 || rarityBonus > 0.03) {
                        if (rarityRoll < 0.25) rarity = 'EPIC';
                      }

                      const slots: Array<'WEAPON' | 'ARMOR' | 'ACCESSORY'> = ['WEAPON', 'ARMOR', 'ACCESSORY'];
                      const slot = slots[Math.floor(Math.random() * slots.length)];
                      const generated = generateRandomItem(monster.level, rarity, slot, character.class);

                      itemDropped = {
                        id: randomUUID(),
                        name: generated.name,
                        slot: generated.slot,
                        rarity: generated.rarity,
                        itemLevel: generated.itemLevel,
                        baseAttack: generated.baseAttack,
                        baseDefense: generated.baseDefense,
                        affixes: JSON.stringify(generated.affixes)
                      };

                      session.itemsAccumulated.push(itemDropped);
                    }
                  }
                }
              }

              // Notify player socket of instant feedback
              io.to(`user_${pId}`).emit('wilderness-loot-reward', {
                monsterName: monster.name,
                xpGained,
                goldGained,
                itemDropped,
                inventoryFull: false
              });
            }
          } catch (err) {
            console.error(`Error buffering wilderness reward:`, err);
          }
        }

        // Broadcast stats changes to sidebars
        io.to('neon_wilderness').emit('wilderness-session-update', Object.values(activeWilderness.sessions));
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
    socket.on('disconnect', async () => {
      if (onlineUsers[socket.id]) {
        const u = onlineUsers[socket.id];
        
        // Commit session rewards to DB
        await commitWildernessSession(u.userId);

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
        
        // Broadcast session updates
        io.to('neon_wilderness').emit('wilderness-session-update', Object.values(activeWilderness.sessions));
      }
    });
  });
};
