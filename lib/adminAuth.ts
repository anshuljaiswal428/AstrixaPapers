import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Standalone admin gate — a single password (ADMIN_PASSWORD) protects the admin
 * dashboard, independent of user accounts. The session cookie holds an
 * HMAC(AUTH_SECRET) token that can't be forged without the server secret.
 */
export const ADMIN_COOKIE = "admin_session";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret";

export function adminToken(): string {
  return crypto.createHmac("sha256", SECRET).update("admin-access-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  return safeEqual(password, expected);
}

/** True if the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value) && safeEqual(value!, adminToken());
}
