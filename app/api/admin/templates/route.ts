import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

/** List all template suggestions (metadata only — the file bytes are fetched per-item). */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await prisma.templateSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      note: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, phone: true, email: true } },
    },
  });

  const suggestions = rows.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    mimeType: r.mimeType,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));

  return NextResponse.json({ suggestions });
}
