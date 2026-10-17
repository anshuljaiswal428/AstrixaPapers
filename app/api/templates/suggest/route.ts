import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Allowed upload types — PDF and Word only. */
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

/** ~5 MB cap on the raw file; base64 is ~1.37× larger so we check the decoded size. */
const MAX_BYTES = 5 * 1024 * 1024;

/** Submit a template suggestion: a PDF/Word sample layout the user wants added. */
export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    fileName?: string;
    mimeType?: string;
    fileData?: string;
    note?: string;
  } | null;

  if (!body?.fileName || !body.mimeType || !body.fileData) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (!ALLOWED_MIMES.has(body.mimeType)) {
    return NextResponse.json(
      { error: "Only PDF or Word (.doc/.docx) files are allowed." },
      { status: 415 },
    );
  }
  if (!body.fileData.startsWith("data:")) {
    return NextResponse.json({ error: "Invalid file data." }, { status: 400 });
  }

  // Estimate decoded size from the base64 payload length.
  const b64 = body.fileData.slice(body.fileData.indexOf(",") + 1);
  const approxBytes = Math.floor((b64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 5 MB)." }, { status: 413 });
  }

  await prisma.templateSuggestion.create({
    data: {
      userId: uid,
      fileName: body.fileName.slice(0, 200),
      mimeType: body.mimeType,
      fileData: body.fileData,
      note: body.note?.slice(0, 1000) || null,
    },
  });

  return NextResponse.json({ ok: true });
}
