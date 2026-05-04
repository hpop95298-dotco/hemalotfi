import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🛡️ BARE MINIMUM TEST ROUTES (Moved up)
app.get("/api/test-v1", (_req, res) => res.status(200).json({ status: "SERVER_IS_ALIVE_V1" }));
app.get("/test-v1", (_req, res) => res.status(200).send("SERVER_IS_ALIVE_V1"));

// Basic CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Simple Logging Helper
function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [INFO] [express] ${message}`);
}

// Custom ServeStatic for Vercel/Production
function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "public");
  
  if (!fs.existsSync(distPath)) {
    log(`Warning: public directory not found at ${distPath}`);
  }

  app.use(express.static(distPath));

  // Fallback to index.html for SPA routing
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

// Simple Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
    // 🏥 Health Check Endpoint for Diagnostics
    app.get("/api/health", async (_req, res) => {
      try {
        const { sql } = await import("drizzle-orm");
        await db.execute(sql`SELECT 1`);
        return res.json({ 
          status: "ok", 
          database: "connected",
          env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasAdminPass: !!process.env.ADMIN_PASSWORD,
            nodeEnv: process.env.NODE_ENV
          }
        });
      } catch (e: any) {
        return res.status(500).json({ 
          status: "error", 
          database: "disconnected", 
          error: e.message 
        });
      }
    });

    const server = registerRoutes(app);

    // Global Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[SERVER ERROR]:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(server, app);
    } else {
      serveStatic(app);
    }

    const PORT = 5000;
    if (process.env.NODE_ENV !== "production") {
      server.listen(PORT, "0.0.0.0", () => {
        log(`serving on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("CRITICAL BOOT ERROR:", error);
  }
})();

export default app;
