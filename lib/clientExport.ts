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

/** Trigger the actual download for a format (assumes payment already cleared). */
export async function downloadPaper(paperId: string, format: "PDF" | "DOCX") {
  if (format === "PDF") {
    window.open(`/paper/${paperId}/print`, "_blank");
    return;
  }
  const doc = await loadDoc(paperId);
  const res = await fetch("/api/export/docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paperId, doc }),
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(doc?.title || "question-paper").replace(/[^\w.-]+/g, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
