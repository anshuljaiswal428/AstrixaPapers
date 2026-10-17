import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { validatePhone, validatePassword } from "@/lib/authValidation";

/**
 * Admin gate backed by the database: the admin dashboard is unlocked by signing
 * in with a real user account whose `role` is "admin" (phone + password). On
 * success we set a session cookie holding an HMAC(AUTH_SECRET) token that can't
 * be forged without the server secret. Admins are designated in the DB (the
 * first registered user is an admin; others are promoted directly in the DB).
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

/** True only if the phone/password match an existing user with role "admin". */
export async function verifyAdminCredentials(
  phone: string,
  password: string,
): Promise<boolean> {
  if (validatePhone(phone) || validatePassword(password)) return false;
  const user = await prisma.user.findUnique({ where: { phone: phone.trim() } });
  if (!user || user.role !== "admin" || !user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

/** True if the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value) && safeEqual(value!, adminToken());
}
