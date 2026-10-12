import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paperToDocx } from "@/lib/export/docx";
import { isFreePaperId } from "@/lib/payments";
import type { PaperDoc } from "@/lib/paper/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { paperId?: string; doc?: PaperDoc };
  const paperId = body.paperId ?? "";
  let doc = body.doc;

  if (!isFreePaperId(paperId)) {
    // Real paper: require auth + a paid DOCX order, and export the stored doc.
    const session = await auth();
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const paid = await prisma.order.findFirst({
      where: { userId: uid, paperId, format: "DOCX", status: "paid" },
    });
    if (!paid) return NextResponse.json({ error: "payment required" }, { status: 402 });

    const paper = await prisma.paper.findFirst({ where: { id: paperId, userId: uid } });
    if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });
    doc = paper.doc as unknown as PaperDoc;
  }

  if (!doc) return NextResponse.json({ error: "missing doc" }, { status: 400 });

  const buffer = await paperToDocx(doc);
  const filename = `${(doc.title || "question-paper").replace(/[^\w.-]+/g, "_")}.docx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
