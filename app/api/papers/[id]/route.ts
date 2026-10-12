import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PaperDoc } from "@/lib/paper/types";

async function userId() {
  return currentUserId();
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const paper = await prisma.paper.findFirst({ where: { id, userId: uid } });
  if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ paper });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { doc?: PaperDoc };
  if (!body.doc) return NextResponse.json({ error: "missing doc" }, { status: 400 });
  const existing = await prisma.paper.findFirst({ where: { id, userId: uid }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const doc = body.doc;
  await prisma.paper.update({
    where: { id },
    data: {
      title: doc.title,
      className: doc.header.className,
      subject: doc.header.subject,
      doc: doc as unknown as object,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.paper.deleteMany({ where: { id, userId: uid } });
  return NextResponse.json({ ok: true });
}
