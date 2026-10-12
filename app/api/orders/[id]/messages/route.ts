import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/auth";
import { isAdmin } from "@/lib/adminAuth";

// Only the last 15 messages per request are kept; older ones are deleted.
const KEEP = 15;

/** Who is accessing this order's chat: the admin, or the order's owner. */
async function resolveRole(orderId: string): Promise<"admin" | "user" | null> {
  if (await isAdmin()) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    return order ? "admin" : null;
  }
  const uid = await currentUserId();
  if (!uid) return null;
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: uid },
    select: { id: true },
  });
  return order ? "user" : null;
}

/** Get the (≤15) messages for this request, in chronological order. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await resolveRole(id);
  if (!role) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const messages = await prisma.message.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages, me: role });
}

/** Send a message in this request's chat (sender inferred from who you are). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await resolveRole(id);
  if (!role) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { body } = (await req.json().catch(() => ({}))) as { body?: string };
  const text = (body ?? "").toString().trim();
  if (!text) return NextResponse.json({ error: "empty message" }, { status: 400 });

  const message = await prisma.message.create({
    data: { orderId: id, sender: role, body: text.slice(0, 2000) },
  });

  // Keep only the newest 15; delete the rest.
  const extra = await prisma.message.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
    skip: KEEP,
    select: { id: true },
  });
  if (extra.length) {
    await prisma.message.deleteMany({ where: { id: { in: extra.map((m) => m.id) } } });
  }

  return NextResponse.json({ message });
}
