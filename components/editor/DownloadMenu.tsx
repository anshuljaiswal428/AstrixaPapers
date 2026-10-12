"use client";

import { useState } from "react";
import { downloadPaper } from "@/lib/clientExport";
import { rupees, PRICE_PAISE, isFreePaperId } from "@/lib/payments";

/**
 * Download menu with two tiers:
 *  - Free: watermarked ("Astrixa Technologies"), instant.
 *  - No watermark: pay via UPI QR → approver confirms → download (handled on /checkout).
 */
export function DownloadMenu({ paperId }: { paperId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [authPrompt, setAuthPrompt] = useState(false);

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
    // Guests (demo/local paper) must sign in first — their work is preserved.
    if (isFreePaperId(paperId)) {
      setOpen(false);
      setAuthPrompt(true);
      return;
    }
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

      {authPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-2xl">
              🔒
            </div>
            <h3 className="text-lg font-semibold text-stone-900">
              Sign in to remove the watermark
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Create a free account (or sign in) to buy the watermark-free download.
            </p>
            <p className="mt-1 text-xs text-green-700">
              ✓ Don’t worry — the paper you’ve built is saved and will be waiting for you right
              after you sign in.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <a
                href="/register"
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
              >
                Sign up
              </a>
              <a
                href="/login"
                className="rounded-lg border px-4 py-2 text-sm hover:bg-stone-100"
              >
                Sign in
              </a>
            </div>
            <button
              onClick={() => setAuthPrompt(false)}
              className="mt-3 text-xs text-stone-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
