import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  findUserByRefreshToken,
  revokeRefreshToken,
} from "../services/auth.js";
import { requireAuth, type AuthLocals } from "../middleware/auth.js";

const router = Router();

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(200).optional(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_COOKIE = "refreshToken";
const ACCESS_COOKIE = "accessToken";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const ACCESS_COOKIE_OPTS = {
  ...COOKIE_OPTS,
  maxAge: 15 * 60 * 1000,
};

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { email, password, name } = parsed.data;
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name: name ?? null })
    .returning({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt });
  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = await createRefreshToken(user.id);
  res.cookie(ACCESS_COOKIE, accessToken, ACCESS_COOKIE_OPTS);
  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = await createRefreshToken(user.id);
  res.cookie(ACCESS_COOKIE, accessToken, ACCESS_COOKIE_OPTS);
  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
});

router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const refreshJwt = req.cookies?.[REFRESH_COOKIE];
  if (!refreshJwt) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }
  const payload = verifyRefreshToken(refreshJwt);
  if (!payload) {
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTS);
    res.clearCookie(ACCESS_COOKIE, ACCESS_COOKIE_OPTS);
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }
  const user = await findUserByRefreshToken(refreshJwt);
  if (!user) {
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTS);
    res.clearCookie(ACCESS_COOKIE, ACCESS_COOKIE_OPTS);
    res.status(401).json({ error: "Refresh token revoked or invalid" });
    return;
  }
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  res.cookie(ACCESS_COOKIE, accessToken, ACCESS_COOKIE_OPTS);
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  const refreshJwt = req.cookies?.[REFRESH_COOKIE];
  if (refreshJwt) await revokeRefreshToken(refreshJwt);
  res.clearCookie(REFRESH_COOKIE, COOKIE_OPTS);
  res.clearCookie(ACCESS_COOKIE, ACCESS_COOKIE_OPTS);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: Request, res: Response<unknown, AuthLocals>): Promise<void> => {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, res.locals.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
});

export default router;
