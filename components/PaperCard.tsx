"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type PaperCardData = {
  id: string;
  title: string;
  className: string | null;
  subject: string | null;
  updatedAt: string | Date;
  marks: number;
  questions: number;
  sections: number;
};

export function PaperCard({ paper }: { paper: PaperCardData }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function del() {
    setDeleting(true);
    const res = await fetch(`/api/papers/${paper.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      alert("Could not delete this paper.");
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/editor/${paper.id}`} className="block">
        {/* Mini paper thumbnail */}
        <div className="relative h-28 overflow-hidden border-b border-stone-100 bg-stone-50 p-3">
          <div className="mx-auto h-full w-3/4 rounded-sm bg-white p-2 shadow-sm">
            <div className="mx-auto mb-1.5 h-1.5 w-2/3 rounded-full bg-stone-300" />
            <div className="space-y-1">
              <div className="h-1 w-full rounded-full bg-stone-200" />
              <div className="h-1 w-5/6 rounded-full bg-stone-200" />
              <div className="h-1 w-full rounded-full bg-stone-200" />
              <div className="h-1 w-2/3 rounded-full bg-stone-200" />
            </div>
          </div>
          <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            {paper.marks} marks
          </span>
        </div>

        <div className="p-4">
          <h3 className="truncate pr-6 font-semibold text-stone-900 group-hover:text-indigo-700">
            {paper.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {paper.className && <Chip>Class {paper.className}</Chip>}
            {paper.subject && <Chip>{paper.subject}</Chip>}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
            <span>
              {paper.sections} sections · {paper.questions} questions
            </span>
            <span>{new Date(paper.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>

      {/* Delete button (appears on hover) */}
      <button
        aria-label="Delete paper"
        title="Delete paper"
        onClick={() => setConfirming(true)}
        className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-stone-400 opacity-0 shadow transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
      >
        <TrashIcon />
      </button>

      {/* Confirmation overlay */}
      {confirming && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/97 p-4 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-stone-800">Delete this paper?</p>
          <p className="max-w-[90%] truncate text-xs text-stone-500">“{paper.title}”</p>
          <p className="text-xs text-red-500">This can’t be undone.</p>
          <div className="mt-1 flex gap-2">
            <button
              onClick={del}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
      {children}
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
