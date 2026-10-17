import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newPaper } from "@/lib/paper/factory";
import type { PaperDoc } from "@/lib/paper/types";

async function userId() {
  return currentUserId();
}

export async function GET() {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const papers = await prisma.paper.findMany({
    where: { userId: uid },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, className: true, subject: true, updatedAt: true },
  });
  return NextResponse.json({ papers });
}

export async function POST(req: Request) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { doc?: PaperDoc; templateId?: string };
  const doc = body.doc ?? newPaper(body.templateId);
  const paper = await prisma.paper.create({
    data: {
      userId: uid,
      title: doc.title,
      className: doc.header.className,
      subject: doc.header.subject,
      doc: doc as unknown as object,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: paper.id });
}
