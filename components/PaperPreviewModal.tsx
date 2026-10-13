"use client";

import { useEffect, useRef, useState } from "react";
import { PaperPreview } from "@/components/preview/PaperPreview";
import type { PaperDoc } from "@/lib/paper/types";

/**
 * Modal that fetches a paper from `endpoint` ({ paper: { title?, doc } }) and
 * renders it in the printed-paper look, scaled to fit the panel width.
 */
export function PaperPreviewModal({
  endpoint,
  fallbackTitle,
  onClose,
}: {
  endpoint: string;
  fallbackTitle?: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{ title?: string; doc: PaperDoc } | null>(null);
  const [error, setError] = useState(false);
  const scaleRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(endpoint);
      if (!res.ok) {
        if (!cancelled) setError(true);
        return;
      }
      const d = (await res.json()) as { paper: { title?: string; doc: PaperDoc } };
      if (!cancelled) setData({ title: d.paper.title, doc: d.paper.doc });
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  // Scale the A4 paper (210mm ≈ 794px) to fit the panel width (never enlarge).
  useEffect(() => {
    const el = scaleRef.current;
    if (!el) return;
    const PAPER_PX = 794;
    const compute = () => {
      const w = el.clientWidth;
      if (w) setZoom(Math.min(1, w / PAPER_PX));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="truncate pr-2 font-semibold text-stone-900">
            {data?.title ?? fallbackTitle ?? "Paper preview"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto bg-stone-200 p-3 sm:p-5">
          {!data ? (
            <div className="p-10 text-center text-sm text-stone-500">
              {error ? "Could not load this paper." : "Loading…"}
            </div>
          ) : (
            <div ref={scaleRef} className="w-full">
              <div style={{ zoom }}>
                <PaperPreview doc={data.doc} watermarkFixed={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
