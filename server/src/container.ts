// Repositories
import { PrismaUserRepository } from './repositories/prisma/PrismaUserRepository';
import { PrismaCharacterRepository } from './repositories/prisma/PrismaCharacterRepository';
import { PrismaItemRepository } from './repositories/prisma/PrismaItemRepository';
import { PrismaRaidHistoryRepository } from './repositories/prisma/PrismaRaidHistoryRepository';

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

// 1. Instantiate Repositories
export const userRepository = new PrismaUserRepository();
export const characterRepository = new PrismaCharacterRepository();
export const itemRepository = new PrismaItemRepository();
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
