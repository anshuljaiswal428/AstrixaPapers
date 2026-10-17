"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaperDoc, Question, QuestionType, Section } from "@/lib/paper/types";
import { paperTotalMarks } from "@/lib/paper/types";
import { newQuestion, newSection, uid, QUESTION_TYPE_LABELS } from "@/lib/paper/factory";
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { WATERMARK } from "@/lib/payments";
import { PaperPreview } from "@/components/preview/PaperPreview";
import { QuestionBodyEditor } from "./QuestionEditors";
import { DownloadMenu } from "./DownloadMenu";

const TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

export function Editor({
  paperId,
  initialDoc,
}: {
  paperId: string;
  initialDoc: PaperDoc;
}) {
  const [doc, setDoc] = useState<PaperDoc>(initialDoc);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const firstRender = useRef(true);

  // Scale the A4 preview down so the whole page width fits the pane (never enlarge).
  const previewRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Mobile: draggable divider to resize the preview (top) vs the builder (bottom).
  const splitRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [previewH, setPreviewH] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Immutable update helper.
  const update = useCallback((fn: (d: PaperDoc) => PaperDoc) => {
    setDoc((d) => fn(structuredClone(d)));
  }, []);

  // Autosave to localStorage (works with no DB) + debounced save to the API.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(`qp:${paperId}`, JSON.stringify(doc));
    } catch {
      /* ignore quota errors */
    }
    setSaving("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/papers/${paperId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doc }),
        });
        setSaving(res.ok ? "saved" : "error");
      } catch {
        setSaving("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [doc, paperId]);

  const total = paperTotalMarks(doc);

  // Fit the fixed-width A4 paper (210mm ≈ 794px) into whatever width the pane has.
  useEffect(() => {
    const el = previewRef.current;
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
  }, []);

  // Track desktop so the dragged height only applies to the stacked mobile layout.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const startDrag = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current || !splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    // Preview sits at the top of the split; its height tracks the pointer.
    const h = Math.min(Math.max(e.clientY - rect.top, 100), rect.height - 140);
    setPreviewH(h);
  };
  const endDrag = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* no capture */
    }
  };

  return (
    <div className="flex h-screen flex-col bg-stone-100">
      {/* Toolbar */}
      <div className="qp-no-print flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-white px-3 py-2 sm:px-4">
        <a href="/dashboard" className="shrink-0 text-sm text-stone-500 hover:underline">
          ← Papers
        </a>
        <input
          value={doc.title}
          onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
          className="order-last w-full min-w-0 rounded border px-2 py-1 text-sm font-medium sm:order-none sm:flex-1"
        />
        <label className="flex shrink-0 items-center gap-1 text-xs text-stone-500">
          Template
          <select
            value={doc.templateId ?? DEFAULT_TEMPLATE_ID}
            onChange={(e) => update((d) => ({ ...d, templateId: e.target.value }))}
            className="rounded border px-1.5 py-1 text-xs text-stone-900"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id} disabled={!t.available}>
                {t.name}
                {t.available ? "" : " (Coming soon)"}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-stone-500">Total: {total} marks</span>
        <span className="text-xs text-stone-400">
          {saving === "saving"
            ? "Saving…"
            : saving === "saved"
              ? "Saved"
              : saving === "error"
                ? "Save failed (local only)"
                : ""}
        </span>
        <DownloadMenu paperId={paperId} />
      </div>

      {/* Mobile: preview on top, paper maker below. Large screens: side-by-side. */}
      <div ref={splitRef} className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        <div className="w-full min-h-0 flex-1 overflow-y-auto bg-stone-50 p-3 sm:p-4 lg:w-[46%] lg:flex-none lg:border-r">
          <HeaderEditor doc={doc} update={update} />
          <div className="mt-4 space-y-4">
            {doc.sections.map((section, si) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={(s) =>
                  update((d) => ({
                    ...d,
                    sections: d.sections.map((x) => (x.id === s.id ? s : x)),
                  }))
                }
                onRemove={() =>
                  update((d) => ({
                    ...d,
                    sections: d.sections.filter((x) => x.id !== section.id),
                  }))
                }
                onMove={(dir) =>
                  update((d) => {
                    const arr = [...d.sections];
                    const j = si + dir;
                    if (j < 0 || j >= arr.length) return d;
                    [arr[si], arr[j]] = [arr[j], arr[si]];
                    return { ...d, sections: arr };
                  })
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              update((d) => ({
                ...d,
                sections: [
                  ...d.sections,
                  newSection(`Section ${String.fromCharCode(65 + d.sections.length)}`),
                ],
              }))
            }
            className="mt-4 w-full rounded border border-dashed py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            + Add section
          </button>
        </div>

        {/* Drag handle (mobile only) — drag up/down to resize preview vs builder. */}
        <div
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          title="Drag to resize"
          className="flex h-6 w-full shrink-0 cursor-row-resize touch-none items-center justify-center border-y bg-white lg:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-stone-300" />
        </div>

        {/* Live preview — resizable on top for phones, full right pane on desktop */}
        <div
          style={
            !isDesktop && previewH != null ? { height: previewH, maxHeight: "none" } : undefined
          }
          className="max-h-[45vh] w-full shrink-0 overflow-auto bg-stone-200 p-3 sm:p-6 lg:max-h-none lg:w-auto lg:flex-1 lg:shrink"
        >
          <div ref={previewRef} className="w-full">
            <div style={{ zoom }}>
              <PaperPreview doc={doc} watermark={WATERMARK} watermarkFixed={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-xs text-stone-500 ${className}`}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded border px-2 py-1 text-sm text-stone-900"
      />
    </label>
  );
}

function HeaderEditor({
  doc,
  update,
}: {
  doc: PaperDoc;
  update: (fn: (d: PaperDoc) => PaperDoc) => void;
}) {
  const h = doc.header;
  const setH = (patch: Partial<typeof h>) =>
    update((d) => ({ ...d, header: { ...d.header, ...patch } }));
  const mt = h.marksTable ?? {};
  return (
    <div className="rounded-lg border bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold text-stone-700">Paper header</h3>
      <div className="space-y-2">
        <Field label="School name" value={h.schoolName} onChange={(v) => setH({ schoolName: v })} />
        <Field label="Exam title" value={h.examTitle} onChange={(v) => setH({ examTitle: v })} />
        <div className="grid grid-cols-3 gap-2">
          <Field label="Class" value={h.className} onChange={(v) => setH({ className: v })} />
          <Field label="Subject" value={h.subject} onChange={(v) => setH({ subject: v })} />
          <Field label="Time" value={h.time} onChange={(v) => setH({ time: v })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field
            label="Written"
            value={String(mt.written ?? "")}
            onChange={(v) => setH({ marksTable: { ...mt, written: Number(v) || undefined } })}
          />
          <Field
            label="Oral"
            value={String(mt.oral ?? "")}
            onChange={(v) => setH({ marksTable: { ...mt, oral: Number(v) || undefined } })}
          />
          <Field
            label="Total"
            value={String(mt.total ?? "")}
            onChange={(v) => setH({ marksTable: { ...mt, total: Number(v) || undefined } })}
          />
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onRemove,
  onMove,
}: {
  section: Section;
  onChange: (s: Section) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [type, setType] = useState<QuestionType>("mcq");
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="flex-1 rounded border px-2 py-1 text-sm font-semibold"
        />
        <button onClick={() => onMove(-1)} className="text-stone-400 hover:text-stone-700">
          ↑
        </button>
        <button onClick={() => onMove(1)} className="text-stone-400 hover:text-stone-700">
          ↓
        </button>
        <button onClick={onRemove} className="text-xs text-red-600 hover:underline">
          delete
        </button>
      </div>

      <div className="space-y-3">
        {section.questions.map((q, qi) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={qi + 1}
            onChange={(nq) =>
              onChange({
                ...section,
                questions: section.questions.map((x) => (x.id === nq.id ? nq : x)),
              })
            }
            onRemove={() =>
              onChange({
                ...section,
                questions: section.questions.filter((x) => x.id !== q.id),
              })
            }
            onMove={(dir) => {
              const arr = [...section.questions];
              const j = qi + dir;
              if (j < 0 || j >= arr.length) return;
              [arr[qi], arr[j]] = [arr[j], arr[qi]];
              onChange({ ...section, questions: arr });
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="rounded border px-2 py-1 text-xs"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            onChange({ ...section, questions: [...section.questions, newQuestion(type)] })
          }
          className="rounded border border-dashed px-3 py-1 text-xs text-stone-600 hover:bg-stone-100"
        >
          + Add question
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  index,
  onChange,
  onRemove,
  onMove,
}: {
  q: Question;
  index: number;
  onChange: (q: Question) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded border border-stone-200 p-2">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-stone-800 px-1.5 text-xs font-bold text-white">Q{index}</span>
        <span className="text-xs uppercase text-stone-400">{QUESTION_TYPE_LABELS[q.type]}</span>
        <span className="flex-1" />
        <button onClick={() => onMove(-1)} className="text-stone-400 hover:text-stone-700">
          ↑
        </button>
        <button onClick={() => onMove(1)} className="text-stone-400 hover:text-stone-700">
          ↓
        </button>
        <button onClick={onRemove} className="text-xs text-red-600 hover:underline">
          delete
        </button>
      </div>

      <input
        value={q.prompt}
        placeholder="Question prompt / instruction"
        onChange={(e) => onChange({ ...q, prompt: e.target.value })}
        className="mb-1 w-full rounded border px-2 py-1 text-sm"
      />
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
        <label className="flex items-center gap-1">
          count
          <input
            type="number"
            min={0}
            value={q.marks.count}
            onChange={(e) =>
              onChange({ ...q, marks: { ...q.marks, count: Number(e.target.value) || 0 } })
            }
            className="w-14 rounded border px-1"
          />
        </label>
        <label className="flex items-center gap-1">
          × per
          <input
            type="number"
            min={0}
            value={q.marks.per}
            onChange={(e) =>
              onChange({ ...q, marks: { ...q.marks, per: Number(e.target.value) || 0 } })
            }
            className="w-14 rounded border px-1"
          />
        </label>
        <span>= {q.marks.count * q.marks.per}</span>
        <input
          value={q.note ?? ""}
          placeholder="note e.g. (any four)"
          onChange={(e) => onChange({ ...q, note: e.target.value || undefined })}
          className="flex-1 rounded border px-2 py-0.5"
        />
      </div>

      <QuestionBodyEditor q={q} onChange={onChange} />
    </div>
  );
}
