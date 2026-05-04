import express from "express";
import { registerRoutes } from "../server/routes";
import cors from "cors";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: true,
  credentials: true
}));

// Test Route
app.get("/api/test-v2", (_req, res) => res.status(200).json({ status: "SERVER_IS_ALIVE_V2" }));

(async () => {
  try {
    registerRoutes(app);
    
    // Error handling
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err);
      res.status(500).json({ message: err.message || "Internal Server Error" });
    });
  } catch (e) {
    console.error("BOOT ERROR:", e);
  }
})();

export default app;
