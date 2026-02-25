import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
import { and, eq, gt } from "drizzle-orm";

const SALT_ROUNDS = 10;
const ACCESS_SECRET = process.env.JWT_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
const ACCESS_TTL = "15m";
const REFRESH_TTL_DAYS = 7;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: { sub: string; email: string }): string {
  return jwt.sign(
    { sub: payload.sub, email: payload.email, type: "access" },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(
    { sub: payload.sub, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: `${REFRESH_TTL_DAYS}d` }
  );
}

export function verifyAccessToken(token: string): { sub: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as { sub: string; email: string; type?: string };
    return decoded?.type === "access" ? { sub: decoded.sub, email: decoded.email } : null;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as { sub: string; type?: string };
    return decoded?.type === "refresh" ? { sub: decoded.sub } : null;
  } catch {
    return null;
  }
}

export async function createRefreshToken(userId: string): Promise<string> {
  const jwtString = signRefreshToken({ sub: userId });
  const tokenHash = hashToken(jwtString);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });
  return jwtString;
}

export async function revokeRefreshToken(refreshJwt: string): Promise<void> {
  const tokenHash = hashToken(refreshJwt);
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function findUserByRefreshToken(
  refreshJwt: string
): Promise<{ id: string; email: string; name: string | null } | null> {
  const tokenHash = hashToken(refreshJwt);
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(refreshTokens)
    .innerJoin(users, eq(users.id, refreshTokens.userId))
    .where(
    and(eq(refreshTokens.tokenHash, tokenHash), gt(refreshTokens.expiresAt, new Date()))
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name };
}
