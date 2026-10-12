import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

const ALLOWED = new Set(["paid", "failed", "pending"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string; paid?: boolean };
  // Back-compat: accept { paid } too, but prefer explicit { status }.
  const status = body.status ?? (body.paid === false ? "failed" : "paid");
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id },
    data: { status, paidAt: status === "paid" ? new Date() : null },
  });
  return NextResponse.json({ ok: true });
}
