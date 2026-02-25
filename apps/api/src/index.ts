import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resumes.js";
import { pool } from "./db/index.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";
const webDist = path.resolve(__dirname, "../../web/dist");

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch {
    res.status(503).json({ ok: false, db: "disconnected" });
  }
});

app.use("/auth", authRoutes);
app.use("/resumes", resumeRoutes);

if (isProduction && fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.status(200).json({
      service: "ResumeFlow API",
      ok: true,
      endpoints: ["/health", "/auth/register", "/auth/login", "/auth/me", "/resumes"],
    });
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
