import type { PaperDoc } from "@/lib/paper/types";

/** Load a paper doc the same way the editor does: sample/local/localStorage/API. */
export async function loadDoc(paperId: string): Promise<PaperDoc | null> {
  if (paperId === "sample") {
    const { samplePaper } = await import("@/lib/paper/sample");
    return samplePaper();
  }
  if (paperId === "local") {
    const s = localStorage.getItem("qp:local");
    if (s) return JSON.parse(s) as PaperDoc;
    const { newPaper } = await import("@/lib/paper/factory");
    return newPaper();
  }
  try {
    const res = await fetch(`/api/papers/${paperId}`);
    if (res.ok) {
      const data = (await res.json()) as { paper: { doc: PaperDoc } };
      return data.paper.doc;
    }
  } catch {
    /* fall through */
  }
  const s = localStorage.getItem(`qp:${paperId}`);
  return s ? (JSON.parse(s) as PaperDoc) : null;
}

/**
 * Trigger a download. `watermark=true` → free watermarked copy.
 * `watermark=false` → no-watermark copy (server enforces an approved paid order).
 */
export async function downloadPaper(
  paperId: string,
  format: "PDF" | "DOCX",
  watermark = true,
) {
  if (format === "PDF") {
    const q = watermark ? "" : "?nowm=1";
    window.open(`/paper/${paperId}/print${q}`, "_blank");
    return;
  }
  const doc = await loadDoc(paperId);
  const res = await fetch("/api/export/docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paperId, doc, watermark }),
  });
  if (!res.ok) {
    if (res.status === 402) throw new Error("Payment not approved yet.");
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = watermark ? "" : "_nowatermark";
  a.download = `${(doc?.title || "question-paper").replace(/[^\w.-]+/g, "_")}${suffix}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
