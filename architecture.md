# Stream Battler Architecture Documentation

This document describes the design, monorepo workspace structure, and technical workflow of the Stream Battler codebase after our architectural refactoring to implement clean enterprise-grade design patterns.

---

## 1. Monorepo Directory Structure

The project is structured as a TypeScript monorepo utilizing **npm Workspaces**:

```
stream-battler/
├── package.json               # Root monorepo workspace configuration
├── playwright.config.ts       # Playwright E2E test configuration
├── architecture.md            # Architecture documentation (this file)
├── README.md                  # Project readme and setup guide
├── tests/                     # Integration and E2E test files
│   └── e2e/
│       ├── keystones.spec.ts  # E2E tests for Keystone passive rules
│       ├── merchant.spec.ts   # E2E tests for merchant mechanics
│       ├── talents.spec.ts    # E2E tests for talent board selection
│       └── raid.spec.ts       # E2E tests for socket-based stream raid spectating
│
├── shared/                    # Workspace Package: Shared game definitions & models
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Unified module entry point
│       ├── constants.ts       # Classes configurations, active skills, passive skill tree nodes
│       └── formulas.ts        # Dynamic character stats calculator, RNG loot generator, and formula thresholds
│
├── client/                    # Workspace Package: Frontend Single Page Application (React / TS / Vite)
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx           # React bootstrap entry point
│   │   ├── App.tsx            # Pure layout routing system
│   │   ├── contexts/          # Global application state contexts
│   │   │   ├── AuthContext.tsx   # Session management & active character profile
│   │   │   ├── SocketContext.tsx # WebSocket lifecycle & event dispatcher
│   │   │   └── UIContext.tsx     # Modals (alerts, class unlocks, confirms) coordination
│   │   ├── pages/
│   │   │   ├── Auth.tsx          # Login & registration view
│   │   │   ├── Dashboard.tsx     # Player profile dashboard
│   │   │   ├── SoloMap.tsx       # Solo Arena game simulation
│   │   │   ├── StreamerLobby.tsx # Streamer Raid coordinator
│   │   │   └── ViewerSpectate.tsx# Viewer Raid spectator
│   │   ├── components/        # Reusable view components
│   │   │   ├── CharacterVisualizer.tsx
│   │   │   ├── PassiveSkillTree.tsx
│   │   │   └── dashboard/        # Dashboard sub-sections
│   │   │       ├── DashboardHeader.tsx
│   │   │       ├── ClassSwitcher.tsx
│   │   │       ├── GearStash.tsx
│   │   │       ├── ClassTalentsTab.tsx
│   │   │       ├── MerchantShopTab.tsx
│   │   │       └── AdminPanelTab.tsx
│   │   └── game/
│   │       ├── physics.ts     # Steering vectors & distance math
│   │       ├── sprites.ts     # Canvas retro pixel-art drawing library
│   │       └── combatEngine.ts# Decoupled stateful combat simulation logic
│   │
│   └── public/
│
└── server/                    # Workspace Package: Backend API and WebSocket Engine (Express / Prisma)
    ├── package.json
    ├── prisma/                # Prisma ORM schemas & SQLite database migrations
    └── src/
        ├── index.ts           # Server start, REST router registrations, and WebSocket coordinator
        ├── container.ts       # Manual Dependency Injection orchestrator
        ├── db.ts              # Prisma database client instance export
        ├── controllers/       # HTTP controllers (parses requests, calls services, sends JSON)
        │   ├── AuthController.ts
        │   ├── CharacterController.ts
        │   ├── InventoryController.ts
        │   ├── ShopController.ts
        │   └── AdminController.ts
        ├── services/          # Pure business and domain logic layer
        │   ├── AuthService.ts
        │   ├── CharacterService.ts
        │   ├── InventoryService.ts
        │   ├── ShopService.ts
        │   └── AdminService.ts
        ├── repositories/      # Database abstraction layer (Repository Pattern)
        │   ├── interfaces/    # Decoupled entity data-access contracts
        │   │   ├── IUserRepository.ts
        │   │   ├── ICharacterRepository.ts
        │   │   ├── IItemRepository.ts
        │   │   └── IRaidHistoryRepository.ts
        │   └── prisma/        # SQLite/PostgreSQL Prisma implementations of interfaces
        │       ├── PrismaUserRepository.ts
        │       ├── PrismaCharacterRepository.ts
        │       ├── PrismaItemRepository.ts
        │       └── PrismaRaidHistoryRepository.ts
        ├── schemas/           # Strict Zod boundary validation schemas
        │   ├── auth.schema.ts
        │   ├── character.schema.ts
        │   ├── inventory.schema.ts
        │   ├── shop.schema.ts
        │   └── admin.schema.ts
        ├── middlewares/       # Express request middlewares
        │   ├── validate.ts       # Schema request validator middleware (Zod v4)
        │   └── errorHandler.ts   # Global operational error handler middleware
        ├── errors/            # Custom operational error classes
        │   └── AppError.ts       # BadRequest, NotFound, Unauthorized error structures
        ├── routes/            # REST API route end-points mapped to Controllers
        └── socket/            # Real-time WebSocket room queue & coordination
            └── lobby.ts

```

---

## 2. Server Architecture: Clean Architecture Layers

To enforce decoupling and separation of concerns on the server, we implement a **Clean Architecture (Controller-Service-Repository)** pattern:

```
┌────────────────────────────────────────────────────────┐
│                        HTTP / REST                     │ Express Router
└───────────────────────────┬────────────────────────────┘
                            │ (req, res)
                            ▼
┌────────────────────────────────────────────────────────┐
│                       MIDDLEWARES                      │ validate.ts & Zod
└───────────────────────────┬────────────────────────────┘
                            │ (Validated Typed Payload)
                            ▼
┌────────────────────────────────────────────────────────┐
│                       CONTROLLER                       │ AuthController, etc.
└───────────────────────────┬────────────────────────────┘
                            │ (Method Call / Parameters)
                            ▼
┌────────────────────────────────────────────────────────┐
│                        SERVICE                         │ AuthService, etc.
└───────────────────────────┬────────────────────────────┘
                            │ (Business Logic Operations)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   REPOSITORY INTERFACE                 │ IUserRepository, etc.
└───────────────────────────┬────────────────────────────┘
                            │ (Decoupled Contract)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 PRISMA REPOSITORY IMPL                 │ PrismaUserRepository, etc.
└───────────────────────────┬────────────────────────────┘
                            │ (Prisma Client Calls)
                            ▼
┌────────────────────────────────────────────────────────┐
│                        DATABASE                        │ SQLite / PostgreSQL
└────────────────────────────────────────────────────────┘
```

### Key Server Elements:
1. **Dependency Injection**: The server avoids hardcoded dependencies or singletons. Instead, objects are manually wired via constructor injection in [container.ts](file:///c:/Users/Ronan/.gemini/antigravity/scratch/stream-battler/server/src/container.ts). This makes testing and swapping implementations (e.g. swap SQLite repository for PostgreSQL in production) trivial.
2. **Boundary Validation**: Request bodies, route parameters, and query parameters are parsed and validated strictly at the routing level using Zod schemas (`server/src/schemas/`) within a unified `validate` middleware.
3. **Unified Error Handling**: Route logic throws custom error instances (e.g. `BadRequestError`, `UnauthorizedError`) defined in [AppError.ts](file:///c:/Users/Ronan/.gemini/antigravity/scratch/stream-battler/server/src/errors/AppError.ts). The global `errorHandler` catches these errors and formats standard JSON responses.
4. **Dynamic Database Provider Switching**: SQLite is used for local development and CI testing (running locally as a file database), while PostgreSQL is used for production (Railway). The script [prepare-prisma.js](file:///c:/Users/Ronan/.gemini/antigravity/scratch/stream-battler/server/scripts/prepare-prisma.js) runs automatically before any Prisma commands. It parses the `DATABASE_URL` protocol: if it detects `postgres://` or `postgresql://`, it rewrites the datasource provider in `schema.prisma` to `"postgresql"`, otherwise it defaults to `"sqlite"`. If `DATABASE_URL` is entirely missing (such as in GitHub Actions), it automatically generates a temporary `.env` file pointing to the local SQLite `dev.db` to ensure validation and tests compile out of the box.

---

## 3. Client Architecture: State Context Isolation

To prevent prop-drilling down the React tree and avoid bloating `App.tsx` with unrelated state hook listeners, the frontend utilizes the **React Context API**:

- **[AuthContext](file:///c:/Users/Ronan/.gemini/antigravity/scratch/stream-battler/client/src/contexts/AuthContext.tsx)**: Coordinates session checking (`/api/auth/me`), login operations, switching active character classes, and tracking character stats or progression level-ups.
- **[SocketContext](file:///c:/Users/Ronan/.gemini/antigravity/scratch/stream-battler/client/src/contexts/SocketContext.tsx)**: Encapsulates Socket.io lifecycle events. Exposes the active socket instance and coordinates lobby queue connections.
- **[UIContext](file:///c:/Users/Ronan/.gemini/antigravity/scratch/stream-battler/client/src/contexts/UIContext.tsx)**: Manages modal components (confirm screens, warning alerts, and class unlock events) by exposing simple imperative-like hook trigger methods.

With context hooks, `App.tsx` behaves as a pure, lightweight router:
```tsx
export default function App() {
  const { user, character, loading } = useAuth();
  const [page, setPage] = useState<PageState>('AUTH');
  ...
  return (
    <main className="flex-grow">
      {page === 'AUTH' && <Auth />}
      {page === 'DASHBOARD' && <Dashboard />}
      {page === 'SOLO_ARENA' && <SoloMap />}
      ...
    </main>
  );
}
```

---

## 4. Decoupled Combat Simulation Engine

Real-time combat is orchestrated through a stateful combat simulation engine module (`client/src/game/combatEngine.ts`):
- **`updateUnitPhysics`**: Manages entity separation calculations and pathfinding navigation.
- **`performBasicAttack`**: Resolves range conditions, computes damage values (applying armor, crit modifiers, elements, and keystones), and initiates projectiler effects.
- **`castActiveSkill`**: Computes active cooldown skill execution for different classes (Warrior stuns, Cleric heals, Ranger arrow rains, Mage AoEs).
- **`updateVisuals`**: Manages visual particles and floating combat text indicators.

This module is completely decoupled from components, allowing both **Solo Arena** runs and **Streamer Lobbies** to use the exact same combat mechanics.

---

## 5. Verification Framework

Validation consists of:
1. **Unit Tests (`vitest`)**: Confirms math formulas return correct stat calculations and level boundaries.
2. **End-to-End Tests (`playwright`)**: Headless browser automation simulating user actions (class selection, shop purchases, equipment swapping, active raid lobbies). Sequenced step runs prevent SQLite lock contention.
