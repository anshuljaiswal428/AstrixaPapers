import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFreePaperId } from "@/lib/payments";

/** Is the no-watermark (paid) download approved for this paper + format? */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId") ?? "";
  const format = searchParams.get("format") === "DOCX" ? "DOCX" : "PDF";

  // Demo papers are always free + watermarked (no approval possible).
  if (isFreePaperId(paperId)) return NextResponse.json({ approved: false });

  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ approved: false });

  const paid = await prisma.order.findFirst({
    where: { userId: uid, paperId, format, status: "paid" },
    select: { id: true },
  });
  return NextResponse.json({ approved: Boolean(paid) });
}
