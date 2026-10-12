import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { paid?: boolean };
  const paid = body.paid !== false;
  await prisma.order.update({
    where: { id },
    data: { status: paid ? "paid" : "failed", paidAt: paid ? new Date() : null },
  });
  return NextResponse.json({ ok: true });
}
