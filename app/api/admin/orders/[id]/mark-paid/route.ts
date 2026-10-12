import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { paid?: boolean };
  const paid = body.paid !== false;
  await prisma.order.update({
    where: { id },
    data: { status: paid ? "paid" : "failed", paidAt: paid ? new Date() : null },
  });
  return NextResponse.json({ ok: true });
}
