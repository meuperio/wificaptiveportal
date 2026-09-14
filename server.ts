import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/api/index.ts';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function startServer() {
  const app = express();
  app.set("trust proxy", 1); // Trust first proxy (Cloud Run / Nginx)
  const PORT = 3000;

  // Phase 8: API Security & Rate Limiting
  app.use(helmet({
    contentSecurityPolicy: false, // Vite HMR needs this disabled in dev
    crossOriginEmbedderPolicy: false
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Suppress proxy header validation warnings
    message: { error: 'Too many requests, please try again later.' }
  });
  
  app.use('/api', limiter);

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

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
