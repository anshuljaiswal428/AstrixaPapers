import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details." },
      { status: 400 },
    );
  }
  const { name, phone, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return NextResponse.json({ error: "Phone number already registered." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  // First registered user becomes admin (the approver who confirms payments).
  const count = await prisma.user.count();
  await prisma.user.create({
    data: { name, phone, passwordHash, role: count === 0 ? "admin" : "user" },
  });
  return NextResponse.json({ ok: true });
}
