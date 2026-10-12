"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PaperDoc } from "@/lib/paper/types";
import { newPaper } from "@/lib/paper/factory";
import { WATERMARK } from "@/lib/payments";
import { PaperPreview } from "@/components/preview/PaperPreview";

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sp = useSearchParams();
  // User asked for a no-watermark copy only if nowm=1 AND it's approved.
  const wantsNoWatermark = sp.get("nowm") === "1";

  const [doc, setDoc] = useState<PaperDoc | null>(null);
  const [watermarked, setWatermarked] = useState(true);
  const [error, setError] = useState("");

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

      if (id === "sample" || id === "local") {
        let s: string | null = null;
        try {
          s = localStorage.getItem(`qp:${id}`);
        } catch {
          /* storage unavailable */
        }
        return setDoc(s ? (JSON.parse(s) as PaperDoc) : newPaper());
      }
      try {
        const res = await fetch(`/api/papers/${id}`);
        if (res.ok) {
          const data = (await res.json()) as { paper: { doc: PaperDoc } };
          return setDoc(data.paper.doc);
        }
        if (res.status === 401) {
          setError("Please sign in, then open the download again.");
          return;
        }
      } catch {
        /* fall through to local cache */
      }
      // Fall back to the browser's autosaved copy; otherwise report instead of printing blank.
      const s = localStorage.getItem(`qp:${id}`);
      if (s) return setDoc(JSON.parse(s) as PaperDoc);
      setError("Couldn’t load this paper. Open it in the editor and try the download again.");
    }
    load();
  }, [id, wantsNoWatermark]);

  // Auto-open the print dialog, but only AFTER fonts and images have painted —
  // otherwise it can fire on a blank page (common with image-heavy papers).
  useEffect(() => {
    if (!doc) return;
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      // Clear any stray selection so the preview shows clean black text.
      window.getSelection()?.removeAllRanges();
      window.print();
    };
    document.title = doc.title || "Question Paper";
    const fontsReady =
      (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready ??
      Promise.resolve();
    const imgs = Array.from(document.images);
    const imagesReady = imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = img.onerror = () => res();
          }),
    );
    Promise.all([fontsReady, ...imagesReady]).then(() => {
      // Two frames to ensure layout/paint is committed before printing.
      requestAnimationFrame(() => requestAnimationFrame(doPrint));
    });
    // Safety fallback so it never hangs waiting on a stuck asset.
    const t = setTimeout(doPrint, 2500);
    return () => clearTimeout(t);
  }, [doc]);

  if (error)
    return (
      <div className="p-10 text-center text-stone-600">
        <p>{error}</p>
        <a href="/dashboard" className="mt-3 inline-block text-indigo-700 underline">
          Go to dashboard
        </a>
      </div>
    );
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
