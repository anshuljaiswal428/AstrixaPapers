"use client";

import { useState } from "react";
import type { PaperTemplate } from "@/lib/templates";

export function TemplateGrid({
  templates,
  onPick,
  showSuggest = true,
}: {
  templates: PaperTemplate[];
  /** Called with the chosen template id. Should navigate away or swap the view on success. */
  onPick: (templateId: string) => void | Promise<void>;
  /** Show the "Suggest a template" upload card (needs a signed-in user). */
  showSuggest?: boolean;
}) {
  const [creating, setCreating] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  async function pick(templateId: string) {
    if (creating) return;
    setCreating(templateId);
    try {
      await onPick(templateId);
    } catch {
      /* onPick surfaces its own errors */
    }
    setCreating(null);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            busy={creating === t.id}
            disabled={!!creating && creating !== t.id}
            onPick={() => pick(t.id)}
          />
        ))}

        {/* Suggest a template card */}
        {showSuggest && (
          <button
            type="button"
            onClick={() => setSuggestOpen(true)}
            className="group flex min-h-[18rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
              +
            </span>
            <span className="font-semibold text-stone-800">Suggest a template</span>
            <span className="max-w-[16rem] text-sm text-stone-500">
              Upload a sample paper (PDF or Word) and we’ll build it into a template.
            </span>
          </button>
        )}
      </div>

      {suggestOpen && <SuggestModal onClose={() => setSuggestOpen(false)} />}
    </>
  );
}

function TemplateCard({
  template,
  busy,
  disabled,
  onPick,
}: {
  template: PaperTemplate;
  busy: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const locked = !template.available;
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        locked
          ? "border-stone-200 opacity-70"
          : "border-stone-200 hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[1/1.1] overflow-hidden border-b border-stone-100 bg-stone-50 p-4">
        {locked ? (
          <div className="grid h-full place-items-center text-stone-300">
            <ClockIcon />
          </div>
        ) : (
          <TemplateThumb />
        )}
        {locked && (
          <span className="absolute right-3 top-3 rounded-full bg-stone-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Coming soon
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="font-semibold text-stone-900">{template.name}</div>
        <p className="mt-1 flex-1 text-sm text-stone-500">{template.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          type="button"
          disabled={locked || disabled || busy}
          onClick={onPick}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
            locked
              ? "cursor-not-allowed bg-stone-100 text-stone-400"
              : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          }`}
        >
          {locked ? "Coming soon" : busy ? "Creating…" : "Use this template"}
        </button>
      </div>
    </div>
  );
}

/** A tiny CSS mock of the classic paper layout for the card thumbnail. */
function TemplateThumb() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[12rem] flex-col rounded bg-white p-3 shadow-inner ring-1 ring-stone-200">
      <div className="mx-auto h-2 w-3/4 rounded bg-stone-700" />
      <div className="relative mt-1">
        <div className="mx-auto h-1.5 w-1/2 rounded bg-stone-400" />
        <div className="mx-auto mt-1 h-1.5 w-2/5 rounded bg-stone-300" />
        <div className="absolute right-0 top-0 grid grid-cols-3 gap-px">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2.5 border border-stone-400" />
          ))}
        </div>
      </div>
      <div className="mt-2 h-px w-full bg-stone-800" />
      <div className="mt-2 space-y-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-1 w-full rounded bg-stone-300" />
            <div className="h-1 w-5/6 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

const ALLOWED_EXT = [".pdf", ".doc", ".docx"];
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function SuggestModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function validate(f: File): string {
    const okExt = ALLOWED_EXT.some((e) => f.name.toLowerCase().endsWith(e));
    if (!ALLOWED_MIMES.has(f.type) && !okExt) {
      return "Only PDF or Word (.doc/.docx) files are allowed.";
    }
    if (f.size > 5 * 1024 * 1024) return "File is too large (max 5 MB).";
    return "";
  }

  function onSelect(f: File | null) {
    setError("");
    if (!f) return setFile(null);
    const msg = validate(f);
    if (msg) {
      setFile(null);
      return setError(msg);
    }
    setFile(f);
  }

  async function submit() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      const fileData = await fileToDataUrl(file);
      // Normalize mime for .doc/.docx when the browser leaves it blank.
      const mimeType =
        file.type ||
        (file.name.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : file.name.toLowerCase().endsWith(".docx")
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/msword");
      const res = await fetch("/api/templates/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType, fileData, note }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-6 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
          <h3 className="text-lg font-semibold">Suggest a template</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/80 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <p className="font-medium text-stone-800">Thanks! Your suggestion was sent.</p>
            <p className="mt-1 text-sm text-stone-500">
              We’ll review your sample and get the template added.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <p className="text-sm text-stone-500">
              Upload a sample question paper and we’ll turn it into a selectable template. PDF or
              Word (.doc/.docx), up to 5 MB.
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
              <UploadIcon />
              {file ? (
                <span className="break-all text-sm font-medium text-stone-800">{file.name}</span>
              ) : (
                <>
                  <span className="text-sm font-medium text-stone-700">Choose a file</span>
                  <span className="text-xs text-stone-400">PDF, DOC, or DOCX</span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
              />
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything we should know about this layout? (optional)"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!file || busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send suggestion"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-indigo-500"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}
