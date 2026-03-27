let initialized = false;
let serverApp: any;
let setupAppFn: any;

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
        message: "Vercel function diagnostic", 
        env_check: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          JWT_SECRET: !!process.env.JWT_SECRET,
          RESEND_API_KEY: !!process.env.RESEND_API_KEY,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    }

    // 4. Dynamic Server Loading (to catch boot errors)
    if (!initialized) {
      try {
        console.log("[BOOT] Loading server module...");
        const serverModule = await import("../server/index");
        serverApp = serverModule.default;
        setupAppFn = serverModule.setupApp;
        
        console.log("[BOOT] Running setupApp...");
        await setupAppFn();
        initialized = true;
        console.log("[BOOT] Server initialized successfully");
      } catch (bootError: any) {
        console.error("SERVER_BOOT_CRASH:", bootError);
        return res.status(500).json({ 
          error: "SERVER_BOOT_CRASH", 
          message: bootError.message, 
          stack: bootError.stack,
          hint: "This usually happens due to a top-level error in server/index.ts or its dependencies."
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
