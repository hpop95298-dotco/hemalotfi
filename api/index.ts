import app, { setupApp } from "../server/index";

let initialized = false;

export default async (req: any, res: any) => {
  try {
    // Diagnostic route
    if (req.url === "/api/test-direct") {
      return res.status(200).json({ 
        ok: true, 
        message: "Vercel function is reached correctly", 
        url: req.url,
        env: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          JWT_SECRET: !!process.env.JWT_SECRET,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    }

    if (!initialized) {
      try {
        await setupApp();
        initialized = true;
      } catch (e: any) {
        console.error("INITIALIZATION_FAILED:", e);
        return res.status(500).json({ error: "Initialization failed", message: e.message, stack: e.stack });
      }
    }
    return app(req, res);
  } catch (err: any) {
    console.error("FATAL_HANDLER_ERROR:", err);
    return res.status(500).json({ 
      error: "FATAL_HANDLER_ERROR", 
      message: err.message, 
      stack: err.stack 
    });
  }
};
