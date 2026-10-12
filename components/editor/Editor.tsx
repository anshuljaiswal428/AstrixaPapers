"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaperDoc, Question, QuestionType, Section } from "@/lib/paper/types";
import { paperTotalMarks } from "@/lib/paper/types";
import { newQuestion, newSection, uid, QUESTION_TYPE_LABELS } from "@/lib/paper/factory";
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

  return (
    <div className="flex h-screen flex-col bg-stone-100">
      {/* Toolbar */}
      <div className="qp-no-print flex items-center gap-3 border-b bg-white px-4 py-2">
        <a href="/dashboard" className="text-sm text-stone-500 hover:underline">
          ← Papers
        </a>
        <input
          value={doc.title}
          onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
          className="flex-1 rounded border px-2 py-1 text-sm font-medium"
        />
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

      {/* Split view */}
      <div className="flex min-h-0 flex-1">
        <div className="w-[46%] overflow-y-auto border-r bg-stone-50 p-4">
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

        {/* Live preview */}
        <div className="flex-1 overflow-y-auto bg-stone-200 p-6">
          <PaperPreview doc={doc} />
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
      <div className="mb-2 flex items-center gap-3 text-xs text-stone-500">
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
