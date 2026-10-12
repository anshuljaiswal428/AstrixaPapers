import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRICE_PAISE } from "@/lib/payments";

/** List the signed-in user's successful (paid) downloads — newest first. */
export async function GET() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: uid, status: "paid" },
    orderBy: { paidAt: "desc" },
    include: { paper: { select: { title: true } } },
  });
  return NextResponse.json({ orders });
}

/** Create (or reuse an open) order for a paper + format. */
export async function POST(req: Request) {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { paperId?: string; format?: string };
  const format = body.format === "DOCX" ? "DOCX" : "PDF";
  if (!body.paperId) return NextResponse.json({ error: "missing paperId" }, { status: 400 });

  const paper = await prisma.paper.findFirst({
    where: { id: body.paperId, userId: uid },
    select: { id: true },
  });
  if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Reuse an existing paid order (don't charge twice) or an open pending one.
  const existing = await prisma.order.findFirst({
    where: { userId: uid, paperId: body.paperId, format, status: { in: ["paid", "pending"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return NextResponse.json({ order: existing });

  const order = await prisma.order.create({
    data: {
      userId: uid,
      paperId: body.paperId,
      format,
      amount: PRICE_PAISE,
      provider: "upi_static",
      status: "pending",
    },
  });
  return NextResponse.json({ order });
}
