import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFreePaperId } from "@/lib/payments";

/** Is a no-watermark download approved for this paper? (One payment unlocks PDF + Word.) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId") ?? "";

  // Demo papers are always free + watermarked (no approval possible).
  if (isFreePaperId(paperId)) return NextResponse.json({ approved: false });

  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ approved: false });

  const paid = await prisma.order.findFirst({
    where: { userId: uid, paperId, status: "paid" },
    select: { id: true },
  });
  return NextResponse.json({ approved: Boolean(paid) });
}
