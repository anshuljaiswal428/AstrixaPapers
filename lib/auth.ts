import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/** Phone: 7–15 digits, optional leading +. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{7,15}$/, "Enter a valid phone number");

export const credentialsSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: phoneSchema,
  password: z.string().min(6),
});

/**
 * Current user id, or null. Wraps auth() in try/catch so a stale/corrupt session
 * token (e.g. after AUTH_SECRET changes) yields a clean 401 instead of a 500.
 */
export async function currentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return (session?.user as { id?: string } | undefined)?.id ?? null;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Keep users signed in for a week (JWT + cookie lifetime).
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { phone: {}, password: {} },
      authorize: async (creds) => {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { phone: parsed.data.phone },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
