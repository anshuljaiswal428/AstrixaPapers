"use client";

import { useState } from "react";
import { downloadPaper } from "@/lib/clientExport";
import { rupees, PRICE_PAISE } from "@/lib/payments";

/**
 * Download menu with two tiers:
 *  - Free: watermarked ("Astrixa Technologies"), instant.
 *  - No watermark: pay via UPI QR → approver confirms → download (handled on /checkout).
 */
export function DownloadMenu({ paperId }: { paperId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");

  async function free(format: "PDF" | "DOCX") {
    setBusy(format);
    try {
      await downloadPaper(paperId, format, true);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy("");
      setOpen(false);
    }
  }

  function paid(format: "PDF" | "DOCX") {
    window.location.href = `/checkout?paper=${paperId}&format=${format}`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded bg-stone-900 px-3 py-1 text-sm text-white hover:bg-stone-700"
      >
        Download ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-72 rounded-lg border bg-white p-2 shadow-lg">
            <div className="px-2 py-1 text-xs font-semibold uppercase text-stone-400">
              Free (with watermark)
            </div>
            <button
              disabled={!!busy}
              onClick={() => free("PDF")}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-stone-100 disabled:opacity-50"
            >
              {busy === "PDF" ? "Preparing…" : "PDF — free, watermarked"}
            </button>
            <button
              disabled={!!busy}
              onClick={() => free("DOCX")}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-stone-100 disabled:opacity-50"
            >
              {busy === "DOCX" ? "Preparing…" : "Word — free, watermarked"}
            </button>

            <div className="mt-1 border-t px-2 pt-2 pb-1 text-xs font-semibold uppercase text-stone-400">
              No watermark (₹{rupees(PRICE_PAISE)})
            </div>
            <button
              onClick={() => paid("PDF")}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-stone-100"
            >
              PDF — pay to remove watermark
            </button>
            <button
              onClick={() => paid("DOCX")}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-stone-100"
            >
              Word — pay to remove watermark
            </button>
            <p className="px-2 pt-2 text-[11px] text-stone-400">
              Pay on the UPI QR, submit your transaction ID, and download once the payment is
              approved.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
