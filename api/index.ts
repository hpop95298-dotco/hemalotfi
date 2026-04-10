import serverApp, { setupApp } from "./server/index";

let initialized = false;

export default async (req: any, res: any) => {
  // 1. Immediate Barebones Diagnostic
  if (req.url === "/api/health-check") {
    return res.status(200).json({ status: "ok", message: "Vercel function is running" });
  }

  try {
    // 2. Environment Verification
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return res.status(500).json({ 
        error: "CONFIG_ERROR", 
        message: "DATABASE_URL is missing in environment variables" 
      });
    }

    // 3. Diagnostic Route
    if (req.url === "/api/test-direct") {
      return res.status(200).json({ 
        ok: true, 
        message: "Vercel function diagnostic (Static Import)", 
        env_check: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          JWT_SECRET: !!process.env.JWT_SECRET,
          RESEND_API_KEY: !!process.env.RESEND_API_KEY,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    }

    // 4. Server Initialization
    if (!initialized) {
      try {
        await setupApp();
        initialized = true;
      } catch (bootError: any) {
        console.error("SERVER_BOOT_CRASH:", bootError);
        return res.status(500).json({ 
          error: "SERVER_BOOT_CRASH", 
          message: bootError.message, 
          stack: bootError.stack
        });
      }
    }

    return serverApp(req, res);
  } catch (err: any) {
    console.error("UNHANDLED_HANDLER_ERROR:", err);
    return res.status(500).json({ 
      error: "UNHANDLED_HANDLER_ERROR", 
      message: err.message, 
      stack: err.stack 
    });
  }
};
