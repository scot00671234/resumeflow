import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resumes.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/resumes", resumeRoutes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
