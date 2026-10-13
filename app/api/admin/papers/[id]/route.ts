import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

/** Full paper document for the admin preview (any user's paper). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const paper = await prisma.paper.findUnique({
    where: { id },
    select: { id: true, title: true, doc: true },
  });
  if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ paper });
}
