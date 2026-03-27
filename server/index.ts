import "dotenv/config";
import path from "path";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { createServer } from "http";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";


// =========================
// 🛡️ CRITICAL SECURITY CHECK
// =========================
const checkSecurityEnv = () => {
  const missing = ['JWT_SECRET', 'ENCRYPTION_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'AUDIT_LOG_PASSWORD'].filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n[FATAL ERROR] Missing mandatory security environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  } else {
    const adminPass = process.env.ADMIN_PASSWORD!;
    if (!adminPass.startsWith("$2b$") && !adminPass.startsWith("$2a$")) {
      console.warn("\n[SECURITY WARNING] ADMIN_PASSWORD is not a bcrypt hash. This is insecure for production.");
    }
    const pw = String(process.env.AUDIT_LOG_PASSWORD || "");
    console.log(`[SECURITY] Audit Vault Key Loaded: ${pw.substring(0, 2)}... (Length: ${pw.length})`);
  }
};
checkSecurityEnv();

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://*.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.google.com", "https://*.googleusercontent.com", "https://*.resend.com"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://api.openai.com", "https://generativelanguage.googleapis.com", "https://*.resend.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.set("trust proxy", 1); // For rate limiting behind a reverse proxy

// 1️⃣ Global Rate Limiter: General DDoS prevention
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 150, // Limit each IP to 150 requests per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." },
});
app.use("/api", globalRateLimiter);

// 2️⃣ Specialized Limiters (to be exported for use in routes)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20, // 20 attempts per IP per 15 mins (relaxed for testing)
  message: { message: "Too many login attempts. High-security lockout active for 15 minutes." },
  skipSuccessfulRequests: true,
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 messages per hour
  message: { message: "Message limit reached. Please wait an hour before sending another." },
});

app.use(cors({ origin: true, credentials: true }));
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

export function log(message: string, source = "express", level: "INFO" | "WARN" | "ERROR" | "SECURITY" = "INFO") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const levelTag = `[${level}]`;
  const padding = " ".repeat(Math.max(0, 10 - levelTag.length));
  console.log(`${formattedTime} ${levelTag}${padding} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Security: Prevent logging sensitive headers
  const sanitizedHeaders = { ...req.headers };
  delete sanitizedHeaders.authorization;
  delete sanitizedHeaders.cookie;

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      const duration = Date.now() - start;
      const status = res.statusCode;
      let level: "INFO" | "WARN" | "ERROR" | "SECURITY" = "INFO";

      if (status >= 500) level = "ERROR";
      else if (status >= 400) level = "SECURITY"; // Log 4xx as security events (potential probes)

      let logLine = `${req.method} ${path} ${status} in ${duration}ms`;

      // Anomaly detection for multiple 4xx
      if (status === 401 || status === 403) {
        logLine += ` [ANOMALY_DETECTED]`;
      }

      // Never log full request/response body in production
      if (process.env.NODE_ENV !== "production" && !path.includes("/api/login")) {
        // Optional: log minimal info in dev
      }

      log(logLine, "express", level);
    }
  });

  next();
});

(async () => {
  try {
    log("Verifying database schema...", "db");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS latitude TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS longitude TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS city TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS country TEXT`);
    log("✅ Database schema updated.", "db");
  } catch (e) {
    log("⚠️ Database sync skipped/failed: " + e, "db");
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : (err.message || "Internal Server Error");

    // Detailed error only in console, NEVER to client in production
    log(`ERROR: ${err.message}`, "error-handler", "ERROR");
    if (process.env.NODE_ENV !== "production") {
      console.error(err);
    }

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5001", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

export default app;
