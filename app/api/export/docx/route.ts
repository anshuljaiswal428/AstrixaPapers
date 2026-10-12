import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paperToDocx } from "@/lib/export/docx";
import { isFreePaperId, WATERMARK } from "@/lib/payments";
import type { PaperDoc } from "@/lib/paper/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    paperId?: string;
    doc?: PaperDoc;
    watermark?: boolean;
  };
  const paperId = body.paperId ?? "";
  // Default to watermarked (free). Only remove it when explicitly requested AND approved.
  const wantsNoWatermark = body.watermark === false;
  let doc = body.doc;
  let watermarked = true;

  if (isFreePaperId(paperId)) {
    // Demo papers: always free + watermarked.
    watermarked = true;
  } else {
    const uid = await currentUserId();
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    if (wantsNoWatermark) {
      // One approved payment for this paper unlocks BOTH PDF and Word.
      const paid = await prisma.order.findFirst({
        where: { userId: uid, paperId, status: "paid" },
        select: { id: true },
      });
      if (!paid) return NextResponse.json({ error: "payment not approved" }, { status: 402 });
      watermarked = false;
    }

    // Always export the server-stored doc for real papers (prevents tampering).
    const paper = await prisma.paper.findFirst({ where: { id: paperId, userId: uid } });
    if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });
    doc = paper.doc as unknown as PaperDoc;
  }

  if (!doc) return NextResponse.json({ error: "missing doc" }, { status: 400 });

  const buffer = await paperToDocx(doc, watermarked ? { watermark: WATERMARK } : {});
  const filename = `${(doc.title || "question-paper").replace(/[^\w.-]+/g, "_")}${
    watermarked ? "" : "_nowatermark"
  }.docx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
