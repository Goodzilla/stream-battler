# Contributing to Stream Battler

First off, thank you for taking the time to contribute to Stream Battler! Contributions from the community help make this project more robust and feature-rich.

Please read through these guidelines to understand how you can help.

---

## 🛠️ Development Workspace Setup

### Prerequisites
- **Node.js** (version 18+ recommended)
- **npm** (version 9+ recommended)

### 1. Clone & Install Dependencies
Clone the repository and install dependencies at the root workspace:
```bash
git clone https://github.com/your-username/stream-battler.git
cd stream-battler
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory. A sample structure is available in the `README.md` file:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-development-jwt-secret"
PORT=3001
NODE_ENV="development"
```

### 3. Database Migration
Generate the Prisma Client types and run initial SQLite database migrations:
```bash
npm run prisma:generate --workspace=server
npm run prisma:deploy --workspace=server
```

> [!TIP]
> **SQLite vs PostgreSQL**: The project dynamically switches database providers based on the `DATABASE_URL` format. In local environments and CI testing, it defaults to **SQLite** (and automatically creates a mock `.env` file if it's missing on CI runs). In production (Railway), the pipeline detects the `postgres://` or `postgresql://` protocol and switches the provider to **PostgreSQL**.

### 4. Running the Dev Server
To start the front-end (Vite) and back-end (Express) servers concurrently:
```bash
npm run dev
```
- **Vite Client**: `http://localhost:5173`
- **Express Server**: `http://localhost:3001` (proxied by Vite automatically)

---

## 📐 Coding Conventions & Architecture

We enforce clean architectural standards to keep the monorepo modular and scalable:

1. **Clean Architecture (Server)**:
   - **Controllers**: Responsible for parsing requests, validating schemas, calling services, and returning JSON. Located in `server/src/controllers/`.
   - **Services**: Pure business domain logic. No HTTP req/res knowledge. Located in `server/src/services/`.
   - **Repositories**: Encapsulate database access behind interfaces (located in `server/src/repositories/`). Allows switching between dev SQLite and production PostgreSQL.
   - **Dependency Injection**: Always use manual constructor injection (wired in `server/src/container.ts`). Avoid using direct database/service singletons in code.
2. **State Contexts (Client)**:
   - Keep page and component layouts decoupled from business state using React Context API (`client/src/contexts/`).
   - Use custom hooks (e.g. `useAuth()`, `useSocket()`, `useUI()`) to consume global session, WebSocket, or dialog logic.
3. **Boundary Validation**:
   - Every input payload must be validated via Zod schemas (`server/src/schemas/`) using the global `validate` middleware.
4. **Error Handling**:
   - Throw operational errors (e.g., `BadRequestError`, `NotFoundError`) defined in `server/src/errors/AppError.ts`. They will be caught by the server global `errorHandler` middleware.

---

## 🧪 Verification & Testing

Before submitting a pull request, ensure that your changes build and all test suites pass.

### 1. Build Verification
Verify that both client and server packages compile correctly:
```bash
npm run build
```

### 2. Unit Tests
Run the Vitest unit tests:
```bash
npm run test:unit
```

### 3. Integration Tests
Run the Playwright E2E integration suite. This runs Chromium browser tests:
```bash
npm run test:e2e
```

---

## 🚀 Submitting a Pull Request

1. Fork the repo and create your branch from `main` (e.g., `feature/cool-new-talent`).
2. Implement your features, following the architectural guidelines.
3. Make sure to write unit or E2E integration tests to cover new behaviors.
4. Ensure all unit and E2E tests pass locally.
5. Commit your changes with clear, descriptive commit messages.
6. Push to your fork and submit a Pull Request to `main`.
7. Once the automated CI checks pass, a maintainer will review your code.
