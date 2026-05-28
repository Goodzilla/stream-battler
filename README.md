# Stream Battlers

Stream Battlers is a full-stack, real-time multiplayer simulation game modeled after Stream Raiders. It allows Twitch streamers to host interactive lobbies and viewer groups to join, customize their characters, allocate passive skill trees, and engage in autobattles against epic custom wave-based monster encounters.

---

## Codebase Architecture

This project is configured as a Node.js monorepo utilizing npm Workspaces:

*   **`shared`**: Holds shared game rules, character formulas (including stat calculators, skill point caps, and level limits), and game constants (like arena profiles and passive skill tree structures).
*   **`server`**: Built using **Clean Architecture** (Controller-Service-Repository pattern). It features:
    *   **Repository Layer**: Database access abstracting sqlite (via Prisma Client) behind interfaces so it can be easily swapped for production PostgreSQL.
    *   **Service Layer**: Pure business and domain logic.
    *   **Controller Layer**: Handles Express request validation (via Zod schemas) and routes JSON responses.
    *   **Dependency Injection**: Instantiated controllers, services, and repositories are wired manually via constructor dependency injection.
    *   **WebSocket Engine**: Real-time room coordinator using Socket.io to synchronize spectator raids.
*   **`client`**: A React + TypeScript web app built with Vite and TailwindCSS. It utilizes the **React Context API** (`AuthContext`, `SocketContext`, `UIContext`) to manage global states (auth, socket events, modular alert confirmations) Imperatively via custom hooks. The combat loop runs retro pixel-art physics animations on an HTML5 canvas via a decoupled stateful combat simulation engine.

For a detailed walkthrough, see [architecture.md](./architecture.md).

---

## Local Development Setup

To run the application locally on your system:

### 1. Installation
Install root and workspace-level dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server` directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-development-jwt-secret"
PORT=3001
NODE_ENV="development"
TWITCH_CLIENT_ID=""
TWITCH_CLIENT_SECRET=""
```

### 3. Generate database client and run migrations
Generate Prisma types and run local migrations to create SQLite tables:
```bash
npm run prisma:generate --workspace=server
npm run prisma:migrate --workspace=server
```

> [!TIP]
> **Database Provider Switching**: The project uses **SQLite** for local development/testing and **PostgreSQL** in production (Railway). The build pipeline runs a custom [prepare-prisma.js](./server/scripts/prepare-prisma.js) script before generating client assets. If `DATABASE_URL` starts with `postgres://` or `postgresql://`, it automatically configures the database provider in `schema.prisma` to `"postgresql"`. Otherwise, it defaults to `"sqlite"` and creates a mock `.env` file if none is present (essential for running E2E tests in CI environments).

### 4. Start Development Server
Run the concurrent dev script from the root workspace:
```bash
npm run dev
```
*   **Frontend client**: Running at `http://localhost:5173` (with Vite hot-reload)
*   **Backend server**: Running at `http://localhost:3001` (proxied by Vite)

---

## Testing

*   **Unit Tests**: Run vitest test suites:
    ```bash
    npm run test:unit
    ```
*   **End-to-End Tests**: Run Playwright browser integration tests:
    ```bash
    npm run test:e2e
    ```

---

## Deployment to Railway (Production)

The production build of the server compiles the frontend React code and serves it as static files from the same process (`client/dist`). Therefore, the entire stack runs as a single service.

### Steps to Deploy:
1.  Initialize a new project on [Railway](https://railway.app) and link your GitHub repository.
2.  Add a **Persistent Volume** on Railway mounted to `/app/data` to ensure your SQLite file persists across container restarts and builds.
3.  Configure the following **Environment Variables** in the Railway service settings:
    *   `NODE_ENV=production`
    *   `PORT=3001` (Railway maps this port to expose the app publicly)
    *   `DATABASE_URL=file:/app/data/dev.db` (Points database path into your mounted persistent volume)
    *   `JWT_SECRET=your-production-jwt-secret-string`
    *   `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (For authentication callback redirect mapping)
4.  Railway will automatically run `npm run build` (which compiles TypeScript and generates Vite assets) followed by `npm run start` (which executes migrations and starts the Express server).
