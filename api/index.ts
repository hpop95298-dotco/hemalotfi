import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cors({
  origin: true,
  credentials: true
}));

// Health check — always works because we don't import routes yet
app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/test-v6', (_req: Request, res: Response) => res.json({ status: 'SERVER_IS_ALIVE_V6' }));

let isInitialized = false;
let initError: any = null;

// Blocking middleware with dynamic import to catch top-level evaluation errors
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!isInitialized && !initError) {
    try {
      // DYNAMIC IMPORT! If top-level code in routes.ts crashes, we catch it here!
      const { registerRoutes } = await import('../server/routes');
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      
      // Append global error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error('[API ERROR]:', err);
        res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
      });
      
      isInitialized = true;
    } catch (err: any) {
      console.error('[API] Failed to initialize (Dynamic Import):', err);
      initError = err;
    }
  }

  if (initError) {
    return res.status(500).json({ 
      message: 'Server initialization failed due to a module crash', 
      errorName: initError.name,
      errorMessage: initError.message,
      errorStack: initError.stack 
    });
  }
  
  next();
});

export default app;
