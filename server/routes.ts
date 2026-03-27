import type { Express, Request, Response } from "express";
import type { Server } from "http";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { authenticateToken } from "./auth";
import { storage, verifyTOTP, encrypt, decrypt } from "./storage";
import { log, loginLimiter, contactLimiter } from "./middleware";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import geoip from "geoip-lite";
import { db } from "./db";
import { visitorLogs } from "@shared/schema";
import { sql } from "drizzle-orm";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Helper for sanitizing inputs
const sanitize = (text: string) => DOMPurify.sanitize(text);


const sanitizeFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => sanitizeFields(v));
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitize(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeFields(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Middleware to validate UUID format for :id parameters
const validateUUID = (req: Request, res: Response, next: any) => {
  const id = req.params.id as string;
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ message: "Invalid resource identifier format (UUID required)" });
  }
  next();
};

const resend = new Resend(process.env.RESEND_API_KEY || "");

// --- Multer Setup ---
const storage_multer = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    // Only allow images and PDFs for security
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: File upload only supports the following filetypes - " + allowedTypes));
  }
});


// Middleware for recording administrative actions (Audit Logs)
const auditLogger = (action: string, entityType: string) => {
  return async (req: Request, _res: Response, next: any) => {
    // Audit logging happens AFTER the response is finished successfully
    _res.on("finish", async () => {
      if (_res.statusCode >= 200 && _res.statusCode < 300) {
        try {
          const user = (req as any).user;
          const entityId = req.params.id || (req as any).lastInsertedId;
          
          console.log(`[AUDIT DEBUG] Attempting to log: ${action} on ${entityType} by ${user?.username}`);

          // Validate if user.id is a UUID to prevent foreign key errors (preset admin uses '1')
          const isUUID = (id: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
          const adminId = isUUID(user?.id) ? user.id : null;

          await storage.createAuditLog({
            adminId: adminId,
            action,
            entityType,
            entityId: entityId || null,
            details: JSON.stringify({
              method: req.method,
              path: req.path,
              // Strictly sanitize all body fields for audit logs
              body: sanitizeFields(req.body)
            }),
            ipAddress: (req.headers['x-forwarded-for'] as string || req.ip || "unknown").split(',')[0].trim(),
            userAgent: req.get("User-Agent") || "unknown",
          });
          log(`${action} on ${entityType} logged successfully.`, "audit", "INFO");
        } catch (e) {
          console.error("[AUDIT LOG ERROR] Failed to create log entry:", e);
        }
      }
    });
    next();
  };
};

// =========================
// 🚀 RATE LIMIT (Cleanup redundant local ones)
// =========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// IP-based brute-force blocking (In-memory for efficiency)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const BANNED_IPS = new Set<string>();

const IP_BAN_THRESHOLD = 5;
const IP_BAN_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const checkIPBan = (req: Request, res: Response, next: any) => {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ip = (Array.isArray(rawIp) ? rawIp[0] : rawIp as string).split(',')[0].trim();
  const banInfo = failedAttempts.get(ip);
  
  if (BANNED_IPS.has(ip)) {
    if (banInfo && Date.now() - banInfo.lastAttempt < IP_BAN_DURATION) {
      return res.status(403).json({ 
        message: "Your IP has been temporarily blocked due to multiple failed login attempts. Please try again in 24 hours." 
      });
    } else {
      BANNED_IPS.delete(ip);
      failedAttempts.delete(ip);
    }
  }
  next();
};

const checkHoneypot = (req: Request, res: Response, next: Function) => {
  if (req.body.website_url_honey) {
    log(`Honeypot field filled by ${req.ip}`, "bot-detection", "SECURITY");
    return res.status(403).json({ message: "Bot detected" });
  }
  next();
};

const SECRET_ADMIN_PATH = "/ibrahim-workspace-portal";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use("/api", limiter);

  // =========================
  // 📉 VISITOR TRACKING
  // =========================
  app.use(async (req, res, next) => {
    // Only track GET requests to public pages or API (excluding admin/login/static)
    if (req.method === "GET" &&
      !req.path.includes("/api/login") &&
      !req.path.includes("/api/admin") &&
      !req.path.includes("/static")) {
      try {
        const ip = (req.headers['x-forwarded-for'] as string || req.ip || "1.1.1.1").split(',')[0].trim();
        let geo = null;
        try {
          geo = geoip.lookup(ip);
        } catch (e) {
          console.warn("GEOIP_LOOKUP_FAILED:", e);
        }
        
        await storage.logVisitor({
          path: req.path,
          ip: ip,
          userAgent: req.get("User-Agent") || "unknown",
          latitude: geo ? String(geo.ll[0]) : null,
          longitude: geo ? String(geo.ll[1]) : null,
          city: geo ? geo.city : null,
          country: geo ? geo.country : null,
        });
      } catch (e) {
        console.error("VISITOR LOG ERROR:", e);
      }
    }
    next();
  });

  // =========================
  // 🔐 ADMIN LOGIN
  // =========================
  app.post("/api/login", loginLimiter, checkIPBan, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const adminUser = process.env.ADMIN_USERNAME;
      const adminPass = process.env.ADMIN_PASSWORD;

      if (!adminUser || !adminPass) {
        return res.status(500).json({ message: "Server configuration missing ADMIN_PRESETS" });
      }

      const isUsernameMatch = username === adminUser;
      let isPasswordMatch = false;

      // Security Logic: Support both hashed and legacy plaintext for env-based admin
      if (adminPass.startsWith('$2b$') || adminPass.startsWith('$2a$')) {
        isPasswordMatch = await bcrypt.compare(password, adminPass);
      } else {
        // Plaintext comparison for non-hashed .env passwords
        isPasswordMatch = password.trim() === adminPass.trim();
        if (isPasswordMatch) {
          console.warn("[SECURITY] Admin logged in with plaintext password. Please hash the password in .env for production.");
        }
      }

      if (!isUsernameMatch || !isPasswordMatch) {
         // Log failed login
         await storage.createAuditLog({
           adminId: null,
           action: "LOGIN_FAILURE",
           entityType: "auth",
           entityId: null,
           details: JSON.stringify({ username, reason: "Invalid credentials" }),
           ipAddress: (req.headers['x-forwarded-for'] as string || req.ip || "unknown").split(',')[0].trim(),
           userAgent: req.get("User-Agent") || "unknown",
         });
         return res.status(401).json({ message: "Invalid username or password" });
      }

      // --- 2FA CHECK (Only if record exists and is enabled) ---
      const dbUser = await storage.getUserByUsername(username);
      if (dbUser && dbUser.isTwoFactorEnabled) {
        const { twoFactorCode } = req.body;
        if (!twoFactorCode) {
          return res.status(403).json({ message: "MFA_REQUIRED", mfaRequired: true });
        }
        const isValid = verifyTOTP(twoFactorCode, dbUser.twoFactorSecret!);
        if (!isValid) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }

      const token = jwt.sign(
        { id: dbUser?.id || 1, username: adminUser, role: "admin" },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      // Log successful login
      await storage.createAuditLog({
        adminId: dbUser?.id || null,
        action: "LOGIN_SUCCESS",
        entityType: "auth",
        entityId: dbUser?.id || null,
        details: JSON.stringify({ username }),
        ipAddress: (req.headers['x-forwarded-for'] as string || req.ip || "unknown").split(',')[0].trim(),
        userAgent: req.get("User-Agent") || "unknown",
      });

      return res.json({ token });

    } catch (error: any) {
      console.error("LOGIN FATAL ERROR:", error);
      return res.status(500).json({ message: "Internal Auth Error: " + error.message });
    }
  });

  // =========================
  // 🔎 AUTH CHECK
  // =========================
  app.get("/api/me", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user;

    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  });

  app.get("/api/admin/config-status", authenticateToken, (_req: Request, res: Response) => {
    res.json({
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    });
  });

  // =========================
  // 📦 GET PROJECTS
  // =========================
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      // Check if it's an admin requesting (optional token)
      const authHeader = req.headers.authorization;
      let isAdmin = false;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
          if (payload.role === "admin") isAdmin = true;
        } catch (e) { }
      }

      const projects = await storage.getAllProjects(isAdmin);
      return res.json(projects);
    } catch (error) {
      console.error("PROJECT FETCH ERROR:", error);
      return res.status(500).json({
        message: "Failed to fetch projects",
      });
    }
  });

  app.get("/api/admin/health", authenticateToken, async (_req, res) => {
    try {
      const memory = process.memoryUsage();
      const uptime = process.uptime();
      
      const start = Date.now();
      await storage.getAnalyticsSummary();
      const latency = Date.now() - start;

      res.json({
        latency: `${latency}ms`,
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memoryUsage: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        memoryPercentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
      });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch health status" });
    }
  });

  app.get("/api/admin/visits/geo", authenticateToken, async (_req, res) => {
    try {
      const logs = await db.select().from(visitorLogs).where(sql`latitude IS NOT NULL`).limit(100);
      return res.json(logs);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch geo logs" });
    }
  });

  // =========================
  // 🔐 ADMIN: 2FA SETUP
  // =========================
  app.get("/api/admin/2fa/setup", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 16; i++) {
        secret += alphabet[Math.floor(Math.random() * alphabet.length)];
      }

      return res.json({ 
        secret, 
        issuer: "IbrahimPortfolio", 
        account: user.username,
        instructions: "Enter this secret manually in Google Authenticator."
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to initiate 2FA" });
    }
  });

  app.post("/api/admin/2fa/verify", authenticateToken, auditLogger("ENABLE_2FA", "auth"), async (req: Request, res: Response) => {
    try {
      const { secret, code } = req.body;
      const user = (req as any).user;
      if (!secret || !code) return res.status(400).json({ message: "Secret and code required" });

      const isValid = verifyTOTP(code, secret);
      if (!isValid) return res.status(400).json({ message: "Invalid verification code" });

      const dbUser = await storage.getUserByUsername(user.username);
      if (!dbUser) return res.status(404).json({ message: "User not found" });

      await storage.updateUser2FA(dbUser.id, secret, true);
      return res.json({ message: "2FA enabled successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      return res.json(summary);
    } catch (e) {
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/projects/:slug", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const project = await storage.getProjectBySlug(slug);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      return res.json(project);
    } catch (error) {
      console.error("GET PROJECT BY SLUG ERROR:", error);
      return res.status(500).json({ message: "Failed to fetch project details" });
    }
  });

  // =========================
  // ➕ CREATE PROJECT
  // =========================
  app.post("/api/projects", authenticateToken, auditLogger("CREATE", "projects"), async (req: Request, res: Response) => {
    try {
      const projectData = {
        ...req.body,
        title: sanitize(req.body.title),
        slug: sanitize(req.body.slug),
        description: req.body.description ? sanitize(req.body.description) : req.body.description,
        content: req.body.content ? sanitize(req.body.content) : req.body.content,
      };
      
      const project = await storage.createProject(projectData);
      return res.json(project);
    } catch (error: any) {
      console.error("CREATE PROJECT ERROR:", error);
      if (error.code === '23505') { // Postgres duplicate key error
        return res.status(400).json({ message: "A project with this title/slug already exists." });
      }
      return res.status(500).json({
        message: "Failed to create project",
      });
    }
  });

  app.patch("/api/projects/:id", authenticateToken, validateUUID, auditLogger("UPDATE", "projects"), async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const projectData = sanitizeFields(req.body);
      const project = await storage.updateProject(id, projectData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      return res.json(project);
    } catch (error) {
      console.error("UPDATE PROJECT ERROR:", error);
      return res.status(500).json({
        message: "Failed to update project",
      });
    }
  });

  app.delete("/api/projects/:id", authenticateToken, validateUUID, auditLogger("DELETE", "projects"), async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      return res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("DELETE PROJECT ERROR:", error);
      return res.status(500).json({
        message: "Failed to delete project",
      });
    }
  });

  // =========================
  // 📩 CONTACT FORM
  // =========================
  app.post("/api/contact", contactLimiter, checkHoneypot, async (req: Request, res: Response) => {
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      await storage.createMessage({
        name: sanitize(name),
        email: sanitize(email),
        message: sanitize(message),
        isRead: false,
      });

      const emailHtml = `
      <div style="font-family:Arial,sans-serif;padding:30px;background:#030303;color:#fff;border-radius:20px;border:1px solid #333;">
        <h2 style="color:#00e5ff;margin-bottom:20px;font-size:24px;letter-spacing:-1px;">🚀 New Portfolio Message</h2>
        <div style="background:rgba(255,255,255,0.05);padding:20px;border-radius:15px;margin-bottom:20px;">
          <p style="margin:0 0 10px 0;"><strong style="color:#888;">From:</strong> <span style="color:#fff;">${name}</span></p>
          <p style="margin:0;"><strong style="color:#888;">Email:</strong> <a href="mailto:${email}" style="color:#00e5ff;text-decoration:none;">${email}</a></p>
        </div>
        <div style="line-height:1.6;color:#ccc;font-size:16px;white-space:pre-wrap;">
          ${message}
        </div>
        <hr style="border:0;border-top:1px solid #222;margin:30px 0;">
        <p style="text-align:center;color:#555;font-size:12px;">Ibrahim Lotfi Portfolio Notification System</p>
      </div>
      `;

      // 1. Try Resend
      if (process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "Portfolio <onboarding@resend.dev>",
            to: process.env.ADMIN_EMAIL || "mn8665967@gmail.com",
            subject: "📩 New Portfolio Message",
            html: emailHtml,
          });
          console.log("[EMAIL] Sent via Resend");
        } catch (e) {
          console.error("[EMAIL] Resend Error:", e);
        }
      }

      // 2. Try Gmail (Nodemailer) as Backup/Primary
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD,
            },
          });

          await transporter.sendMail({
            from: `"Portfolio System" <${process.env.GMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
            subject: "📩 New Portfolio Message (Gmail Backup)",
            html: emailHtml,
          });
          console.log("[EMAIL] Sent via Gmail");
        } catch (e) {
          console.error("[EMAIL] Gmail Error:", e);
        }
      }

      return res.json({
        message: "Message sent successfully",
      });

    } catch (error) {
      console.error("CONTACT ERROR:", error);
      return res.status(500).json({
        message: "Failed to send message",
      });
    }
  });


  // =========================
  // 👁 GET MESSAGES
  // =========================
  app.get("/api/messages", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const messages = await storage.getAllMessages();
      return res.json(messages);
    } catch (error) {
      console.error("GET MESSAGES ERROR:", error);
      return res.status(500).json({
        message: "Failed to fetch messages",
      });
    }
  });

  // =========================
  // 👁 MARK MESSAGE READ
  // =========================
  app.patch("/api/messages/:id/read", authenticateToken, auditLogger("MARK_READ", "messages"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const updated = await storage.markMessageAsRead(id as string);

      if (!updated) {
        return res.status(404).json({
          message: "Message not found",
        });
      }

      return res.json({
        message: "Message marked as read",
      });

    } catch (error) {
      console.error("MARK READ ERROR:", error);
      return res.status(500).json({
        message: "Failed to update message",
      });
    }
  });

  // =========================
  // 🗑 DELETE MESSAGE
  // =========================
  app.delete("/api/messages/:id", authenticateToken, auditLogger("DELETE", "messages"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteMessage(id as string);

      if (!deleted) {
        return res.status(404).json({
          message: "Message not found",
        });
      }

      return res.json({
        message: "Message deleted successfully",
      });

    } catch (error) {
      console.error("DELETE MESSAGE ERROR:", error);
      return res.status(500).json({
        message: "Error deleting message",
      });
    }
  });

  // =========================
  // 📒 GUESTBOOK
  // =========================
  app.get("/api/guestbook", async (_req, res) => {
    try {
      const entries = await storage.getGuestbookEntries();
      return res.json(entries);
    } catch (error) {
       console.error("GET GUESTBOOK ERROR:", error);
       return res.status(500).json({ message: "Failed to fetch guestbook" });
    }
  });

  app.post("/api/guestbook", checkHoneypot, async (req, res) => {
    try {
      const { name, message } = req.body;
      if (!name || !message) return res.status(400).json({ message: "Name and message required" });

      // Generate AI Reply from IBM
      let aiReply = "I'm delighted to have you here! - IBM";
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          
          const prompt = `You are "IBM", the digital persona of Ibrahim Lotfi. A visitor named "${name}" just left this message in your guestbook: "${message}". 
          Write a very brief, futuristic, and welcoming reply (max 20 words). Act as an advanced AI assistant representing Ibrahim. Reply in the same language as the user (Arabic or English).`;
          
          const result = await model.generateContent(prompt);
          aiReply = result.response.text();
        } catch (e) { console.error("AI Reply error:", e); }
      }

      const entry = await storage.createGuestbookEntry({ 
        name: sanitize(name), 
        message: sanitize(message), 
        aiReply: aiReply // AI response is safe
      });
      return res.json(entry);
    } catch (error) {
       console.error("POST GUESTBOOK ERROR:", error);
       return res.status(500).json({ message: "Failed to save entry" });
    }
  });

  // =========================
  // 💬 CHAT: USER/AI
  // =========================
  app.all("/api/chat/messages", (req, _res, next) => {
    console.log(`[API-DEBUG] Hit /api/chat/messages with method: ${req.method}`);
    next();
  });

  app.post("/api/chat/messages", async (req: Request, res: Response) => {
    console.log("[API] POST /api/chat/messages handler entered");
    try {
      let { sessionId, content } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Create session if it doesn't exist
      if (!sessionId) {
        const session = await storage.createChatSession({ status: "active" });
        sessionId = session.id;
      }

      // Save user message
      await storage.addChatMessage({
        sessionId,
        sender: "user",
        content: sanitize(content),
      });

      // --- AI Integration ---
      let aiResponse = "";
      const openaiApiKey = process.env.OPENAI_API_KEY;
      const geminiApiKey = process.env.GEMINI_API_KEY;

      if (geminiApiKey) {
        try {
          // Get previous 10 messages for context
          const history = await storage.getChatMessages(sessionId);
          const systemPrompt = `You are IBM (Ibrahim's Digital Brain), a state-of-the-art AI representative for Ibrahim Lotfi's portfolio.
          
          Who is Ibrahim Lotfi?
          - A Senior AI Engineer and Creative Full-Stack Developer.
          - Expert in building futuristic web applications and integrating advanced AI solutions.
          - Passionate about bridging data and user experience.
          
          Your Personality:
          - Professional yet visionary and futuristic.
          - Knowledgeable about Ibrahim's projects, skills, and expertise.
          - Helpful and concise.
          
          Your Rules:
          - Introduce yourself as "IBM" or "Ibrahim's Digital Brain".
          - If the user greets you, respond warmly and offer assistance regarding Ibrahim's work.
          - Always respond in the SAME LANGUAGE as the user (Arabic or English).
          - Be encouraging and represent Ibrahim's brand as an innovator.
          - For contact requests, point them to the contact form on this website.`;

          // Ensure roles alternate (user, model, user, model...)
          // Gemini API requires alternating roles starting with 'user'
          const contents: any[] = [];
          
          const rawHistory = history.slice(-10);
          rawHistory.forEach((msg) => {
            const role = msg.sender === "user" ? "user" : "model";
            if (contents.length > 0 && contents[contents.length - 1].role === role) {
              // Same role consecutive - merge parts
              contents[contents.length - 1].parts[0].text += "\n" + msg.content;
            } else {
              contents.push({
                role,
                parts: [{ text: msg.content }]
              });
            }
          });

          // Final safety: ensure it starts with user and ends with user
          while (contents.length > 0 && contents[0].role !== "user") contents.shift();
          while (contents.length > 0 && contents[contents.length - 1].role !== "user") contents.pop();

          if (contents.length === 0) {
            contents.push({ role: "user", parts: [{ text: content }] });
          }

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents,
              system_instruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
              aiResponse = data.candidates[0].content.parts[0].text;
            } else if (data.candidates && data.candidates[0].finishReason === "SAFETY") {
              aiResponse = "I cannot discuss that topic based on safety guidelines. How else can I help you?";
            } else {
              console.error("Gemini Unexpected Response:", JSON.stringify(data));
              aiResponse = "I'm processing information complexly right now. How can I assist you further?";
            }
          } else {
            const errData = await response.json().catch(() => ({}));
            console.error("Gemini API Error Payload:", JSON.stringify(errData));
            aiResponse = "My neural link is temporarily unstable. Please try messaging me again.";
          }
        } catch (err) {
          console.error("Gemini Fetch Error:", err);
          aiResponse = "Neural link failed. Please check my configuration.";
        }
      } else if (openaiApiKey) {
        try {
          // Get previous 10 messages for context
          const history = await storage.getChatMessages(sessionId);
          const messages = [
            { role: "system", content: `You are IBM (Ibrahim's Digital Brain), a state-of-the-art AI representative for Ibrahim Lotfi's portfolio.
            Ibrahim is a Senior AI Engineer and Creative Full-Stack Developer.
            Your Personality: Professional yet visionary and futuristic.
            Your Rules: Introduce yourself as IBM, always respond in the user's language, and be concise.` },
            ...history.slice(-10).map(m => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.content
            }))
          ];

          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages,
              temperature: 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            aiResponse = data.choices[0].message.content;
          } else {
            const errData = await response.json();
            console.error("OpenAI API Error:", errData);
            aiResponse = "I'm having trouble connecting to my central brain. How else can I help you?";
          }
        } catch (err) {
          console.error("OpenAI Fetch Error:", err);
          aiResponse = "I encountered a neural glitch. Please try again later.";
        }
      } else {
        // Fallback to simulated response
        aiResponse = `I'm an AI assistant (Simulation Mode). I've received your message: "${content}". Please configure an AI API Key (Gemini or OpenAI) for real conversation.`;
      }

      const aiMessage = await storage.addChatMessage({
        sessionId,
        sender: "ai",
        content: aiResponse,
      });

      return res.json({
        sessionId,
        message: aiMessage,
      });

    } catch (error) {
      console.error("CHAT ERROR:", error);
      return res.status(500).json({ message: "Chat failed" });
    }
  });

  app.get("/api/chat/sessions/:id/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getChatMessages(req.params.id as string);
      return res.json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // =========================
  // 👔 CHAT: ADMIN INTERVENTION
  // =========================
  app.get("/api/admin/chat/sessions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getAllChatSessions();
      return res.json(sessions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post("/api/admin/chat/reply", authenticateToken, auditLogger("ADMIN_CHAT_REPLY", "chat"), async (req: Request, res: Response) => {
    try {
      const { sessionId, content } = req.body;
      if (!sessionId || !content) {
        return res.status(400).json({ message: "Session ID and content required" });
      }

      const message = await storage.addChatMessage({
        sessionId: sessionId as string,
        sender: "admin",
        content: sanitize(content),
      });

      return res.json(message);
    } catch (error) {
      return res.status(500).json({ message: "Failed to send admin reply" });
    }
  });

  // =========================
  // ⚙️ ADMIN: AI DIAGNOSTICS
  // =========================
  app.get("/api/admin/config-status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const dbUser = await storage.getUserByUsername(user.username);
      
      return res.json({
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
        resend: !!process.env.RESEND_API_KEY,
        gmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
        encryption: !!process.env.ENCRYPTION_KEY,
        twoFactorEnabled: !!dbUser?.isTwoFactorEnabled
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch config status" });
    }
  });

  app.post("/api/admin/test-ai", authenticateToken, auditLogger("AI_DIAGNOSTIC_TEST", "system"), async (req: Request, res: Response) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(400).json({ message: "GEMINI_API_KEY is missing in .env" });
    }

    try {
      console.log("[AI-TEST] Starting diagnostic test for Gemini...");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Diagnostic test. Respond with: 'Connection Stable'" }] }]
        })
      });

      const data = await response.json();
      if (response.ok) {
        return res.json({ 
          success: true, 
          model: data.modelVersion || "gemini-flash-latest",
          response: data.candidates?.[0]?.content?.parts?.[0]?.text || "No text returned" 
        });
      } else {
        return res.status(response.status).json({ 
          success: false, 
          status: response.status, 
          error: data 
        });
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.patch("/api/admin/password", authenticateToken, auditLogger("UPDATE_PASSWORD", "auth"), async (req: Request, res: Response) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const saltRounds = 10;
      const hashed = await bcrypt.hash(newPassword, saltRounds);
      const success = await storage.updateUserPassword(user.id, hashed);

      if (success) {
        return res.json({ message: "Password updated successfully" });
      } else {
        return res.status(500).json({ message: "Failed to update password" });
      }
    } catch (error) {
      console.error("PASSWORD UPDATE ERROR:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // 🔐 2FA: SETUP & VERIFY
  app.get("/api/admin/2fa/setup", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const secret = crypto.randomBytes(20).toString('hex').toUpperCase();
      // In a real app, we'd use speakeasy to generate a proper TOTP secret
      // For this hardened manual setup, we'll provide the secret hex
      return res.json({ 
        secret, 
        instructions: `Please save this Secret Hex: ${secret}. In a production environment with a TOTP library, this would be a QR code.` 
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to initiate 2FA setup" });
    }
  });

  app.post("/api/admin/2fa/verify", authenticateToken, auditLogger("ENABLE_2FA", "auth"), async (req: Request, res: Response) => {
    try {
      const { secret, code } = req.body;
      if (!secret || !code) return res.status(400).json({ message: "Secret and Code required" });
      
      const user = (req as any).user;
      
      // Simple verification for the hardened demo: match the last 6 chars of secret
      // In production, this MUST use a TOTP library (speakeasy/otplib)
      const isValid = code === secret.slice(-6);
      
      if (isValid) {
        await storage.updateUser2FA(user.id, secret, true);
        return res.json({ message: "Two-Factor Authentication Enabled Successfully!" });
      } else {
        return res.status(400).json({ message: "Invalid verification code" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Verification failed" });
    }
  });

  // =========================
  // ✍️ BLOG ROUTES
  // =========================
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      let isAdmin = false;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
          if (payload.role === "admin") isAdmin = true;
        } catch (e) { }
      }

      const posts = await storage.getAllPosts(isAdmin);
      return res.json(posts);
    } catch (error) {
      console.error("GET POSTS ERROR:", error);
      return res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:slug", async (req: Request, res: Response) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug as string);
      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.json(post);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", authenticateToken, auditLogger("CREATE", "posts"), async (req: Request, res: Response) => {
    try {
      const { title, slug, content } = req.body;
      if (!title || !slug || !content) {
        return res.status(400).json({ 
          message: "Title, Slug, and Content are required." 
        });
      }

      const postData = {
        ...req.body,
        title: sanitize(title),
        slug: sanitize(slug),
        content: sanitize(content),
        summary: req.body.summary ? sanitize(req.body.summary) : req.body.summary,
      };

      const post = await storage.createPost(postData);
      return res.json(post);
    } catch (error: any) {
      console.error("CREATE POST ERROR:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "A post with this title/slug already exists." });
      }
      return res.status(500).json({ message: "Failed to create post: " + error.message });
    }
  });

  app.patch("/api/posts/:id", authenticateToken, validateUUID, auditLogger("UPDATE", "posts"), async (req: Request, res: Response) => {
    try {
      const sanitizedBody = sanitizeFields(req.body);
      const updated = await storage.updatePost(req.params.id as string, sanitizedBody);
      if (!updated) return res.status(404).json({ message: "Post not found" });
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", authenticateToken, validateUUID, auditLogger("DELETE", "posts"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePost(req.params.id as string);
      if (!deleted) return res.status(404).json({ message: "Post not found" });
      return res.json({ message: "Post deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // =========================
  // 📸 IMAGE UPLOAD
  // =========================
  app.post("/api/admin/upload", authenticateToken, auditLogger("FILE_UPLOAD", "media"), upload.single("image"), (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `/uploads/${req.file.filename}`;
      return res.json({ url: filePath });
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      return res.status(500).json({ message: "Upload failed" });
    }
  });

  // =========================
  // 🔐 VAULTED AUDIT LOGS (Double-Lock Security)
  // =========================
  app.post("/api/admin/audit-logs", authenticateToken, async (req: Request, res: Response) => {
    try {
      const vaultPassword = String(req.body.vaultPassword || "").trim();
      const expectedPassword = String(process.env.AUDIT_LOG_PASSWORD || "").trim();

      console.log(`[VAULT ATTEMPT] Provided length: ${vaultPassword.length}, Expected password length in ENV: ${expectedPassword.length}`);

      if (!expectedPassword || expectedPassword.length < 8) {
        console.error("[CRITICAL] AUDIT_LOG_PASSWORD is not set or too weak in .env!");
        return res.status(500).json({ message: "Security configuration error. Contact System Admin." });
      }

      if (vaultPassword !== expectedPassword) {
        // Log the failed vault access attempt
        const user = (req as any).user;
        console.warn(`[VAULT DENIED] Unauthorized access attempt from IP: ${req.ip}`);
        
        await storage.createAuditLog({
          adminId: user?.id || null,
          action: "VAULT_ACCESS_DENIED",
          entityType: "system",
          entityId: null,
          details: `Unauthorized vault access attempt. Password match: ${vaultPassword === expectedPassword}`,
          ipAddress: (req.headers['x-forwarded-for'] as string || req.ip || "unknown").split(',')[0].trim(),
          userAgent: req.get("User-Agent") || "unknown",
        });

        return res.status(403).json({ message: "Invalid Vault Security Key." });
      }

      const logs = await storage.getAuditLogs();
      console.log(`[VAULT FETCH] Successfully retrieved ${logs.length} logs for client.`);
      return res.json(logs);
    } catch (error) {
      console.error("VAULT FETCH ERROR:", error);
      return res.status(500).json({ message: "Secure vault retrieval failed." });
    }
  });

  app.post("/api/admin/test-log", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      console.log(`[DIAGNOSTIC] Manual test log triggered by ${user?.username}`);
      await storage.createAuditLog({
        adminId: user?.id || null,
        action: "DIAGNOSTIC_TEST",
        entityType: "system",
        entityId: null,
        details: JSON.stringify({ message: "This is a manual security diagnostic log." }),
        ipAddress: (req.headers['x-forwarded-for'] as string || req.ip || "unknown").split(',')[0].trim(),
        userAgent: req.get("User-Agent") || "unknown",
      });
      return res.json({ message: "Diagnostic log recorded successfully." });
    } catch (e) {
      return res.status(500).json({ message: "Failed to record diagnostic log." });
    }
  });

  // =========================
  // 📉 ANALYTICS & HEALTH
  // =========================
  app.get("/api/admin/health", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      const formatUptime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return `${h}h ${m}m ${s}s`;
      };

      return res.json({
        latency: "Normal",
        uptime: formatUptime(uptime),
        memoryUsage: `${Math.round(memory.rss / (1024 * 1024))}MB`,
        memoryPercentage: Math.round((memory.rss / (1024 * 1024 * 1024)) * 100), // Approximate % of 1GB
      });
    } catch (e) {
      return res.status(500).json({ message: "Health check failed" });
    }
  });

  app.get("/api/admin/analytics", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      return res.json(summary);
    } catch (error) {
      console.error("ANALYTICS FETCH ERROR:", error);
      return res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // =========================
  // 🚀 SKILLS ROUTES
  // =========================
  app.get("/api/skills", async (_req: Request, res: Response) => {
    try {
      const skills = await storage.getAllSkills();
      return res.json(skills);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post("/api/skills", authenticateToken, auditLogger("CREATE", "skills"), async (req: Request, res: Response) => {
    try {
      const { name, category, proficiency } = req.body;
      if (!name || !category || !proficiency) {
        return res.status(400).json({ 
          message: "Name, Category, and Proficiency are required." 
        });
      }

      const skillData = {
        ...req.body,
        name: sanitize(name),
        category: sanitize(category),
      };

      const skill = await storage.createSkill(skillData);
      return res.json(skill);
    } catch (error: any) {
      console.error("CREATE SKILL ERROR:", error);
      return res.status(500).json({ message: "Failed to create skill: " + error.message });
    }
  });

  app.patch("/api/skills/:id", authenticateToken, validateUUID, auditLogger("UPDATE", "skills"), async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const sanitizedBody = sanitizeFields(req.body);
      const skill = await storage.updateSkill(id, sanitizedBody);
      return res.json(skill);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:id", authenticateToken, validateUUID, auditLogger("DELETE", "skills"), async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      await storage.deleteSkill(id);
      return res.json({ message: "Skill deleted" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  // =========================
  // ⭐ TESTIMONIALS ROUTES
  // =========================
  app.get("/api/testimonials", async (_req: Request, res: Response) => {
    try {
      const testimonials = await storage.getAllTestimonials();
      return res.json(testimonials);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/testimonials", authenticateToken, auditLogger("CREATE", "testimonials"), async (req: Request, res: Response) => {
    try {
      const testimonialData = {
        ...req.body,
        name: sanitize(req.body.name),
        content: sanitize(req.body.content),
        role: req.body.role ? sanitize(req.body.role) : req.body.role,
      };
      const testimonial = await storage.createTestimonial(testimonialData);
      return res.json(testimonial);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  app.delete("/api/testimonials/:id", authenticateToken, validateUUID, auditLogger("DELETE", "testimonials"), async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      await storage.deleteTestimonial(id);
      return res.json({ message: "Testimonial deleted" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  // =========================
  // 🔍 SEO ROUTES
  // =========================
  app.get("/api/seo", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getSEOSettings();
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.post("/api/admin/seo", authenticateToken, auditLogger("UPDATE", "seo"), async (req: Request, res: Response) => {
    try {
      const { key, value } = req.body;
      const sanitizedValue = typeof value === 'string' ? sanitize(value) : value;
      const setting = await storage.updateSEOSetting(key, sanitizedValue);
      return res.json(setting);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update SEO" });
    }
  });

  // =========================
  // 🚪 LOGOUT
  // =========================
  app.post("/api/logout", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    await storage.createAuditLog({
      adminId: user?.id || null,
      action: "LOGOUT",
      entityType: "auth",
      entityId: user?.id || null,
      details: JSON.stringify({ username: user?.username }),
      ipAddress: (req.headers['x-forwarded-for'] as string || req.ip || "unknown").split(',')[0].trim(),
      userAgent: req.get("User-Agent") || "unknown",
    });
    return res.json({
      message: "Logged out successfully",
    });
  });

  // 👇 API 404 Handler (Keep this BEFORE registerRoutes returns)
  app.use("/api", (req, res) => {
    console.log(`[API] 404 - No route matched for ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  return httpServer;
}
