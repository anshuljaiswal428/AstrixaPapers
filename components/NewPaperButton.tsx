"use client";

import Link from "next/link";

/** Routes to the template picker, where the user chooses a layout before the editor. */
export function NewPaperButton() {
  return (
    <Link
      href="/new"
      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
    >
      + New paper
    </Link>
  );
}
