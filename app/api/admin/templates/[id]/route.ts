import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

/** Download the uploaded file for a suggestion (decoded from its data URL). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;

  const s = await prisma.templateSuggestion.findUnique({ where: { id } });
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const b64 = s.fileData.slice(s.fileData.indexOf(",") + 1);
  const bytes = Buffer.from(b64, "base64");
  const safeName = s.fileName.replace(/[^\w.-]+/g, "_");

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": s.mimeType,
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}

/** Toggle review status: { status: "pending" | "reviewed" }. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const status = body.status === "reviewed" ? "reviewed" : "pending";
  await prisma.templateSuggestion.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}

/** Delete a suggestion. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.templateSuggestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
