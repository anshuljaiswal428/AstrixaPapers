import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function uidOf() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
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

/** Attach the user-submitted UPI transaction reference (UTR). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await uidOf();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { utr?: string };
  const order = await prisma.order.findFirst({ where: { id, userId: uid }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.order.update({ where: { id }, data: { utr: body.utr ?? null } });
  return NextResponse.json({ ok: true });
}
