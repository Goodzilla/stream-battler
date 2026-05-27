import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { authRouter } from './routes/auth';
import { characterRouter } from './routes/character';
import { inventoryRouter } from './routes/inventory';
import { leaderboardRouter } from './routes/leaderboard';
import { adminRouter } from './routes/admin';
import { shopRouter } from './routes/shop';
import { setupSocketHandlers, activeLobbies } from './socket/lobby';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// CORS setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// REST API Endpoints
app.use('/api/auth', authRouter);
app.use('/api/character', characterRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/shop', shopRouter);

// Endpoint to fetch active lobbies
app.get('/api/lobbies', (req, res) => {
  res.json(Object.values(activeLobbies));
});

// Serve frontend client build statically in production
if (process.env.NODE_ENV === 'production' || true) {
  // We configure this to serve in both for easy testing of production mode,
  // pointing to the compiled client files.
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));

  app.get('*', (req, res) => {
    // For client-side routing, fallback to index.html
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
}

// Bind WebSocket handlers
setupSocketHandlers(io);

// Ensure heikob is admin on startup
async function ensureAdmin() {
  try {
    const { prisma } = await import('./db');
    const user = await prisma.user.findFirst({
      where: { username: 'heikob' }
    });
    if (user && !user.isAdmin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true }
      });
      console.log('Successfully promoted heikob to admin.');
    }
  } catch (err) {
    console.error('Error ensuring admin user:', err);
  }
}

// Start server
server.listen(Number(PORT), () => {
  console.log(`Stream Battler Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  ensureAdmin();
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    const { prisma } = await import('./db');
    await prisma.$disconnect();
    console.log('Database disconnected. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
