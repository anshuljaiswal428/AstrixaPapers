import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRICE_PAISE, upiLink } from "@/lib/payments";

/**
 * Build the UPI QR payload server-side so the VPA/payee stay server-only
 * (no NEXT_PUBLIC_ prefix needed). Falls back to the old public names so it
 * keeps working whatever the env var is called.
 */
function buildUpi(order: { id: string; paperId: string; amount: number }) {
  const vpa = process.env.UPI_VPA ?? process.env.NEXT_PUBLIC_UPI_VPA ?? "yourname@okaxis";
  const payeeName =
    process.env.UPI_PAYEE_NAME ?? process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "Question Paper Builder";
  const link = upiLink({
    vpa,
    payeeName,
    amountPaise: order.amount,
    note: `Paper ${order.paperId}`,
    orderId: order.id,
  });
  return { link, vpa };
}

/**
 * List the signed-in user's download records:
 *  - approved (paid), and
 *  - submitted but awaiting approval (pending with a transaction ID).
 * Orders created but never paid (no UTR) are omitted as noise.
 */
export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: {
      userId: uid,
      OR: [{ status: "paid" }, { status: "pending", utr: { not: null } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      paper: { select: { title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { sender: true, createdAt: true } },
    },
  });
  // Expose only the latest message (for the unread chat indicator).
  const shaped = orders.map(({ messages, ...o }) => ({ ...o, lastMessage: messages[0] ?? null }));
  return NextResponse.json({ orders: shaped });
}

/** Create (or reuse an open) order for a paper + format. */
export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { paperId?: string; format?: string };
  const format = body.format === "DOCX" ? "DOCX" : "PDF";
  if (!body.paperId) return NextResponse.json({ error: "missing paperId" }, { status: 400 });

  const paper = await prisma.paper.findFirst({
    where: { id: body.paperId, userId: uid },
    select: { id: true },
  });
  if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });

  // One order per paper (either format unlocks both) — reuse any open/paid one.
  const existing = await prisma.order.findFirst({
    where: { userId: uid, paperId: body.paperId, status: { in: ["paid", "pending"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return NextResponse.json({ order: existing, upi: buildUpi(existing) });

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
  return NextResponse.json({ order, upi: buildUpi(order) });
}
