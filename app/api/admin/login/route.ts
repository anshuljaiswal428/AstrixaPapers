import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, verifyAdminCredentials } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const { phone, password } = (await req.json().catch(() => ({}))) as {
    phone?: string;
    password?: string;
  };

  if (!phone || !password || !(await verifyAdminCredentials(phone, password))) {
    return NextResponse.json(
      { error: "Invalid admin credentials." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
