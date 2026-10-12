"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PaperDoc } from "@/lib/paper/types";
import { newPaper } from "@/lib/paper/factory";
import { samplePaper } from "@/lib/paper/sample";
import { WATERMARK } from "@/lib/payments";
import { PaperPreview } from "@/components/preview/PaperPreview";

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sp = useSearchParams();
  // User asked for a no-watermark copy only if nowm=1 AND it's approved.
  const wantsNoWatermark = sp.get("nowm") === "1";

  const [doc, setDoc] = useState<PaperDoc | null>(null);
  const [watermarked, setWatermarked] = useState(true);

  useEffect(() => {
    async function load() {
      // Decide watermark: only drop it if the paid download is approved.
      let approved = false;
      if (wantsNoWatermark) {
        try {
          const r = await fetch(`/api/orders/check?paperId=${id}&format=PDF`);
          approved = r.ok && ((await r.json()) as { approved: boolean }).approved;
        } catch {
          approved = false;
        }
      }
      setWatermarked(!approved);

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
  }, [id, wantsNoWatermark]);

  useEffect(() => {
    if (doc) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [doc]);

  if (!doc) return <div className="p-10 text-stone-500">Loading…</div>;

  return (
    <div>
      <div className="qp-no-print flex items-center justify-center gap-3 bg-stone-800 p-3 text-white">
        <span>
          Use your browser’s “Save as PDF” in the print dialog.
          {watermarked ? " (Free copy — watermarked.)" : " (Paid copy — no watermark.)"}
        </span>
        <button
          onClick={() => window.print()}
          className="rounded bg-white px-3 py-1 text-sm text-stone-900"
        >
          Print / Save PDF
        </button>
      </div>
      <PaperPreview doc={doc} watermark={watermarked ? WATERMARK : undefined} />
    </div>
  );
}
