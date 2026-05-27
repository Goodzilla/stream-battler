# Stream Battler Architecture Documentation

This document describes the design, monorepo workspace structure, and technical workflow of the Stream Battler codebase after our modular refactoring.

## 1. Directory Structure

```
stream-battler/
├── package.json               # Root monorepo workspace configuration
├── playwright.config.ts       # Playwright E2E test configuration
├── tests/                     # Integration and E2E test files
│   └── e2e/
│       ├── merchant.spec.ts   # E2E tests for merchant mechanics
│       ├── talents.spec.ts    # E2E tests for talent board selection
│       └── raid.spec.ts       # E2E tests for socket-based stream raid spectating
│
├── shared/                    # Workspace Package: Shared game definitions & models
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Unified module entry point (using ES specifier resolution)
│       ├── constants.ts       # Classes configurations, active skills, passive skill tree nodes
│       └── formulas.ts        # Dynamic character stats calculator, RNG loot generator, and formula thresholds
│
├── client/                    # Workspace Package: Frontend Single Page Application (React / TS / Vite)
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx           # React bootstrap entry point
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx  # Parent state controller for the Player Dashboard
│   │   │   ├── SoloMap.tsx    # Solo Arena game view controller
│   │   │   ├── StreamerLobby.tsx # Streamer Raid game view controller
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── dashboard/     # Sub-components extracted from Dashboard page:
│   │   │       ├── DashboardHeader.tsx
│   │   │       ├── ClassSwitcher.tsx
│   │   │       ├── GearStash.tsx
│   │   │       ├── ClassTalentsTab.tsx
│   │   │       ├── MerchantShopTab.tsx
│   │   │       └── AdminPanelTab.tsx
│   │   └── game/
│   │       ├── physics.ts     # Core steering and distance vector math
│   │       ├── sprites.ts     # Themed retro pixel canvas renderer
│   │       └── combatEngine.ts # Shared combat simulation logic: unit loops, attacks, skills, and visuals
│
└── server/                    # Workspace Package: Backend API and WebSocket Engine (Express / Prisma / SQLite)
    ├── package.json
    ├── prisma/                # Prisma ORM schema and migrations database
    └── src/
        ├── index.ts           # Server start, Express HTTP routing, and socket.io namespace coordination
        ├── routes/            # REST API endpoints (auth, character, merchant, etc.)
        └── game/              # Backend validation mechanics
```

---

## 2. Shared Workspace Package (`shared`)

To prevent code duplication and discrepancies between client combat predictions and server verification/loot generation, the game's core constants and mathematical formulas are encapsulated in the standalone `shared` npm package.

### Key modules:
- **`shared/src/constants.ts`**: Defines standard coefficients for character classes, talents, and passive nodes.
- **`shared/src/formulas.ts`**: Contains:
  - `calculateCharacterStats`: Takes class configurations, talents, passive tree nodes, and equipped items, applying multipliers and returns a complete stat block.
  - `generateRandomItem`: Handles drop scaling and prefix roll weight calculation.

*Development Tip:* The `shared` workspace compiles to JavaScript target ES2022 modules using `.js` import specifiers to support seamless interoperability between Node's commonjs compatibility loaders and Vite's bundle-time rollup analyzer.

---

## 3. Component Architecture: Dashboard Tabulation

The player dashboard is refactored from a single monolithic file into a parent container coordination layout:
- **`Dashboard.tsx`**: Keeps parent states like the active navigation tab, character stats, and communicates actions to API routes.
- **`DashboardHeader.tsx`**: Displays basic header information (player details, level, and resource balances).
- **`GearStash.tsx`**: Displays equipped items and backpack grid. Includes interactive overlays for equipping and selling.
- **`ClassTalentsTab.tsx` / `MerchantShopTab.tsx` / `AdminPanelTab.tsx`**: Separate tabs handle class talent points investment, refreshing stocks from merchants, and admin item/gold generation tools.

---

## 4. Canvas Combat Simulation Engine (`combatEngine.ts`)

The Canvas update loop has been decoupled from React component lifecycle methods by introducing a standalone combat engine module (`client/src/game/combatEngine.ts`).

### Data flow:
```
                 [Animation Request Frame Loop]
                                │  (dt)
                                ▼
         ┌──────────────────────────────────────────────┐
         │     combatEngine.ts: updateUnitPhysics()     │
         │  - Computes collision & separation vectors    │
         │  - Computes target approach steering          │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │    combatEngine.ts: performBasicAttack()     │
         │  - Computes range, armor reduction, crits    │
         │  - Generates visual projectile lines         │
         │  - Triggers lifesteal & reflect procs        │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │     combatEngine.ts: castActiveSkill()       │
         │  - Warrior Stun / Rogue Multi-Strikes        │
         │  - Mage Fireball / Ranger Arrow Rain AoEs    │
         │  - Cleric Holy Nova (healing / AoE damage)   │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │       combatEngine.ts: updateVisuals()       │
         │  - Ticks FloatingText positions & lifespans  │
         │  - Ticks Particles velocity & alphas         │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
                  [Canvas Render Operations]
           - Iterates over living sprites, particles,
             and float text objects to output visuals
```

This ensures both the **Solo Arena** (`SoloMap.tsx`) and **Twitch Live Raids** (`StreamerLobby.tsx`) use the same combat engine rules and equations.

---

## 5. Verification Framework

Validation consists of:
1. **Unit Tests (`vitest`)**: Confirms math formulas return correct stat calculations and level boundaries.
2. **End-to-End Tests (`playwright`)**: Uses headless browsers to simulate user logins, shop purchases, equipment stash interactions, talent selection, and Socket.io raid streams.
