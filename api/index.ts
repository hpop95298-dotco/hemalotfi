import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cors({
  origin: true,
  credentials: true
}));

// Health check — always works even if DB is down
app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/test-v5', (_req: Request, res: Response) => res.json({ status: 'SERVER_IS_ALIVE_V5' }));

// Initialize routes at module load time (required for Vercel serverless)
const httpServer = createServer(app);

let initError: unknown = null;
const initPromise = registerRoutes(httpServer, app).catch((err: unknown) => {
  console.error('[API] Failed to register routes:', err);
  initError = err;
});

// Global error handler — always returns JSON
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API ERROR]:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Export a handler that waits for init before serving
export default async function handler(req: Request, res: Response) {
  await initPromise;
  if (initError) {
    return res.status(500).json({ message: 'Server initialization failed', error: String(initError) });
  }
  return app(req, res);
}
