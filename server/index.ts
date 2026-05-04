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
import { log, loginLimiter, contactLimiter } from "./middleware";


// =========================
// 🛡️ CRITICAL SECURITY CHECK
// =========================
export const checkSecurityEnv = () => {
  const missing = ['JWT_SECRET', 'ENCRYPTION_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'AUDIT_LOG_PASSWORD'].filter(k => !process.env[k]);
  if (missing.length > 0) {
    const msg = `[FATAL] Missing mandatory security environment variables: ${missing.join(', ')}`;
    console.error(`\n${msg}`);
    // Do not exit in serverless/Vercel environments, let the setupApp handle/log it
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
       process.exit(1);
    }
    return { ok: false, message: msg };
  } else {
    const adminPass = process.env.ADMIN_PASSWORD!;
    if (!adminPass.startsWith("$2b$") && !adminPass.startsWith("$2a$")) {
      console.warn("\n[SECURITY WARNING] ADMIN_PASSWORD is not a bcrypt hash. This is insecure for production. Please hash it.");
    }
    const auditPass = process.env.AUDIT_LOG_PASSWORD!;
    if (!auditPass.startsWith("$2b$") && !auditPass.startsWith("$2a$")) {
      console.warn("\n[SECURITY WARNING] AUDIT_LOG_PASSWORD is not a bcrypt hash. This is insecure for production.");
    }
    return { ok: true };
  }
};
// On Vercel, we call this inside setupApp instead of at top-level
if (!process.env.VERCEL) {
  checkSecurityEnv();
}

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://cdn.jsdelivr.net", 
          "https://*.googleapis.com",
          "https://www.googletagmanager.com",
          "https://*.google-analytics.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        imgSrc: [
          "'self'", 
          "data:", 
          "https://images.unsplash.com", 
          "https://*.google.com", 
          "https://*.googleusercontent.com", 
          "https://*.resend.com",
          "https://www.googletagmanager.com"
        ],
        connectSrc: [
          "'self'", 
          "https://*.googleapis.com", 
          "https://api.openai.com", 
          "https://generativelanguage.googleapis.com", 
          "https://*.resend.com",
          "https://*.google-analytics.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
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

app.set("trust proxy", 1); 

// Restrict CORS origins
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:5001",
  "https://ibrahim-portfolio.vercel.app",
  "https://www.ibrahimlotfi.online",
  "https://ibrahimlotfi.online"
];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

// 🛡️ Global Rate Limiter: General DDoS prevention
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Balanced limit for portfolio
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." },
});
app.use("/api", globalRateLimiter);

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

export { log };

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Security: Prevent logging sensitive headers
  const sanitizedHeaders = { ...req.headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'set-cookie', 'proxy-authorization'];
  sensitiveHeaders.forEach(h => delete sanitizedHeaders[h]);

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

export const setupApp = async () => {
  // 🛡️ Security Check (Mandatory for Vercel to report missing ENV)
  if (process.env.VERCEL) {
    const security = checkSecurityEnv();
    if (!security.ok) {
      throw new Error(security.message);
    }
  }

    /* REDUNDANT ON VERCEL: Handled by drizzle-kit push
    log("Verifying database schema...", "db");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS latitude TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS longitude TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS city TEXT`);
    await db.execute(sql`ALTER TABLE visitor_logs ADD COLUMN IF NOT EXISTS country TEXT`);
    log("✅ Database schema updated.", "db");
    */

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : (err.message || "Internal Server Error");

    log(`ERROR: ${err.message}`, "error-handler", "ERROR");
    if (process.env.NODE_ENV !== "production") {
      console.error(err);
    }

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    serveStatic(app);
  } else if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }
};

// Only run if not on Vercel
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  (async () => {
    await setupApp();
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
}

export default app;
