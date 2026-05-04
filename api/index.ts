import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes.js";
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
app.get("/api/test-v3", (_req, res) => res.status(200).json({ status: "SERVER_IS_ALIVE_V3" }));

// Initialize routes asynchronously
const init = async () => {
  try {
    await registerRoutes(app);
    console.log("Routes registered successfully");
  } catch (e) {
    console.error("BOOT ERROR:", e);
  }
};

init();

// Global Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[SERVER ERROR]:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

export default app;
