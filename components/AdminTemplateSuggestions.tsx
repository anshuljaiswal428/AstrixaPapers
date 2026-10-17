"use client";

import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  fileName: string;
  mimeType: string;
  note: string | null;
  status: string;
  createdAt: string;
  user: { name: string; phone: string; email: string | null };
};

const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB");

function fileLabel(mime: string) {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("word") || mime.includes("msword")) return "Word";
  return "File";
}

export function AdminTemplateSuggestions() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/templates");
      if (res.ok && !cancelled) {
        setItems(((await res.json()) as { suggestions: Suggestion[] }).suggestions);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(s: Suggestion) {
    setBusyId(s.id);
    const next = s.status === "reviewed" ? "pending" : "reviewed";
    await fetch(`/api/admin/templates/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setItems((prev) => prev.map((it) => (it.id === s.id ? { ...it, status: next } : it)));
    setBusyId(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    setBusyId(id);
    await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== id));
    setBusyId(null);
  }

  const pending = items.filter((i) => i.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border bg-white" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
        No template suggestions yet.
      </p>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-sm text-stone-500">
        <span className="font-semibold text-stone-800">{items.length}</span> suggestion(s)
        {pending > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {pending} pending
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700">
              {fileLabel(s.mimeType)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-stone-900">{s.fileName}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                <span>{s.user.name}</span>
                <span>·</span>
                <span>{s.user.phone}</span>
                {s.user.email && (
                  <>
                    <span>·</span>
                    <span className="truncate">{s.user.email}</span>
                  </>
                )}
                <span>·</span>
                <span>{fmtDate(s.createdAt)}</span>
              </div>
              {s.note && <p className="mt-1 text-sm text-stone-600">“{s.note}”</p>}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  s.status === "reviewed"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {s.status === "reviewed" ? "Reviewed" : "Pending"}
              </span>
              <a
                href={`/api/admin/templates/${s.id}`}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                Download
              </a>
              <button
                disabled={busyId === s.id}
                onClick={() => toggle(s)}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
              >
                {s.status === "reviewed" ? "Mark pending" : "Mark reviewed"}
              </button>
              <button
                disabled={busyId === s.id}
                onClick={() => remove(s.id)}
                className="rounded-lg px-2 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
