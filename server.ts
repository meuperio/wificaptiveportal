import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initMockDb } from './src/db/mockDb.ts';
import apiRouter from './src/api/index.ts';
import { DbClient } from "./src/db/db.ts";

async function startServer() {
  DbClient.authenticateBackend();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Initialize DB (Mock)
  initMockDb();

  // API Routes
  app.use('/api/v1', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
