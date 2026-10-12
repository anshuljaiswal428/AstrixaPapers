import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password (min 6 chars)." }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  // First registered user becomes admin (for the unlock panel).
  const count = await prisma.user.count();
  await prisma.user.create({
    data: { email, passwordHash, name: (body.name as string) || null, role: count === 0 ? "admin" : "user" },
  });
  return NextResponse.json({ ok: true });
}
