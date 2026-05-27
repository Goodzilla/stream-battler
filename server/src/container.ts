// Repositories
import { PrismaUserRepository } from './repositories/prisma/PrismaUserRepository';
import { PrismaCharacterRepository } from './repositories/prisma/PrismaCharacterRepository';
import { PrismaItemRepository } from './repositories/prisma/PrismaItemRepository';
import { PrismaRaidHistoryRepository } from './repositories/prisma/PrismaRaidHistoryRepository';
import { MemoryCache } from './cache/MemoryCache';
import { CachedUserRepository } from './repositories/prisma/CachedUserRepository';
import { CachedCharacterRepository } from './repositories/prisma/CachedCharacterRepository';
import { CachedItemRepository } from './repositories/prisma/CachedItemRepository';

// Services
import { AuthService } from './services/AuthService';
import { CharacterService } from './services/CharacterService';
import { InventoryService } from './services/InventoryService';
import { ShopService } from './services/ShopService';
import { AdminService } from './services/AdminService';

// Controllers
import { AuthController } from './controllers/AuthController';
import { CharacterController } from './controllers/CharacterController';
import { InventoryController } from './controllers/InventoryController';
import { ShopController } from './controllers/ShopController';
import { AdminController } from './controllers/AdminController';

// 0. Instantiate Cache
export const memoryCache = new MemoryCache();

// 1. Instantiate Repositories
const prismaUserRepository = new PrismaUserRepository();
const prismaCharacterRepository = new PrismaCharacterRepository();
const prismaItemRepository = new PrismaItemRepository();

export const userRepository = new CachedUserRepository(prismaUserRepository, memoryCache);
export const characterRepository = new CachedCharacterRepository(prismaCharacterRepository, memoryCache);
export const itemRepository = new CachedItemRepository(prismaItemRepository, memoryCache);
export const raidHistoryRepository = new PrismaRaidHistoryRepository();

// 2. Instantiate Services (Inject Repositories)
export const authService = new AuthService(userRepository, characterRepository, itemRepository);
export const characterService = new CharacterService(userRepository, characterRepository, itemRepository);
export const inventoryService = new InventoryService(userRepository, characterRepository, itemRepository);
export const shopService = new ShopService(userRepository, characterRepository, itemRepository);
export const adminService = new AdminService(userRepository, characterRepository, itemRepository);

// 3. Instantiate Controllers (Inject Services)
export const authController = new AuthController(authService);
export const characterController = new CharacterController(characterService);
export const inventoryController = new InventoryController(inventoryService);
export const shopController = new ShopController(shopService);
export const adminController = new AdminController(adminService);
