"use client";

import { useState } from "react";

export function NewPaperButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/papers", { method: "POST" });
        if (res.ok) {
          const { id } = (await res.json()) as { id: string };
          window.location.href = `/editor/${id}`;
        } else {
          setBusy(false);
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-50"
    >
      {busy ? "Creating…" : "+ New paper"}
    </button>
  );
}
