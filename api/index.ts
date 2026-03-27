import app, { setupApp } from "../server/index";

let initialized = false;

export default async (req: any, res: any) => {
  // Diagnostic route
  if (req.url === "/api/test-direct") {
    return res.status(200).json({ ok: true, message: "Vercel function is reached correctly", url: req.url });
  }

  if (!initialized) {
    try {
      await setupApp();
      initialized = true;
    } catch (e: any) {
      return res.status(500).json({ error: "Initialization failed", message: e.message });
    }
  }
  return app(req, res);
};
