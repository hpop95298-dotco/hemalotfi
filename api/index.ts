import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: true,
  credentials: true
}));

app.get('/api/test-v4', (req, res) => res.json({ status: "SERVER_IS_ALIVE_V4" }));

let routesInitialized = false;

app.use(async (req, res, next) => {
  if (!routesInitialized) {
    try {
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      routesInitialized = true;
    } catch (err) {
      console.error("Initialization Error:", err);
    }
  }
  next();
});

export default app;
