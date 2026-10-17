/**
 * Pure auth field validators — shared by the client forms and the server zod
 * schemas (lib/auth.ts) so the rules never drift. No server-only imports, so
 * this is safe to pull into client components.
 */

/** Phone: optional leading +, then 7–15 digits. */
export const PHONE_RE = /^\+?\d{7,15}$/;

/** Minimum password length. */
export const PASSWORD_MIN = 6;

export function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  return null;
}

export function validatePhone(phone: string): string | null {
  const v = phone.trim();
  if (!v) return "Phone number is required.";
  if (!PHONE_RE.test(v)) return "Enter a valid phone number (7–15 digits).";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  return null;
}
