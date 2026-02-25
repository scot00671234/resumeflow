import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface AuthLocals {
  userId: string;
  email: string;
}

export async function requireAuth(
  req: Request,
  res: Response<unknown, AuthLocals>,
  next: NextFunction
): Promise<void> {
  const token =
    req.cookies?.accessToken ??
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(users).where(eq(users.id, payload.sub));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.locals.userId = user.id;
  res.locals.email = user.email;
  next();
}
