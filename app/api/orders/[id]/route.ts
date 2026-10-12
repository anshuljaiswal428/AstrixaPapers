import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function uidOf() {
  return currentUserId();
}

/** Poll order status. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await uidOf();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, userId: uid } });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ order });
}

/** Attach the UPI transaction reference (UTR) + payment screenshot. Both required. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await uidOf();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { utr?: string; screenshotUrl?: string };

  const utr = (body.utr ?? "").trim();
  const screenshot = body.screenshotUrl ?? "";
  if (!utr) return NextResponse.json({ error: "Transaction ID is required." }, { status: 400 });
  if (!screenshot.startsWith("data:image/")) {
    return NextResponse.json({ error: "A payment screenshot is required." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({ where: { id, userId: uid }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.order.update({
    where: { id },
    data: { utr, screenshotUrl: screenshot },
  });
  return NextResponse.json({ ok: true });
}
