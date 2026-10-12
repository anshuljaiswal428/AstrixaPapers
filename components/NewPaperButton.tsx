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
      className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
    >
      {busy ? "Creating…" : "+ New paper"}
    </button>
  );
}
