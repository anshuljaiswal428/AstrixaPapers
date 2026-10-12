"use client";

import { use, useEffect, useState } from "react";
import type { PaperDoc } from "@/lib/paper/types";
import { newPaper } from "@/lib/paper/factory";
import { samplePaper } from "@/lib/paper/sample";
import { PaperPreview } from "@/components/preview/PaperPreview";

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [doc, setDoc] = useState<PaperDoc | null>(null);

  useEffect(() => {
    async function load() {
      if (id === "sample") return setDoc(samplePaper());
      if (id === "local") {
        const s = localStorage.getItem("qp:local");
        return setDoc(s ? (JSON.parse(s) as PaperDoc) : newPaper());
      }
      try {
        const res = await fetch(`/api/papers/${id}`);
        if (res.ok) {
          const data = (await res.json()) as { paper: { doc: PaperDoc } };
          return setDoc(data.paper.doc);
        }
      } catch {
        /* fall through */
      }
      const s = localStorage.getItem(`qp:${id}`);
      setDoc(s ? (JSON.parse(s) as PaperDoc) : newPaper());
    }
    load();
  }, [id]);

  useEffect(() => {
    if (doc) {
      // Give the browser a tick to lay out, then open the print dialog (Save as PDF).
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [doc]);

  if (!doc) return <div className="p-10 text-stone-500">Loading…</div>;

  return (
    <div>
      <div className="qp-no-print flex items-center justify-center gap-3 bg-stone-800 p-3 text-white">
        <span>Use your browser’s “Save as PDF” in the print dialog.</span>
        <button
          onClick={() => window.print()}
          className="rounded bg-white px-3 py-1 text-sm text-stone-900"
        >
          Print / Save PDF
        </button>
      </div>
      <PaperPreview doc={doc} />
    </div>
  );
}
