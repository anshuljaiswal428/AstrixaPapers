"use client";

import type {
  CaseStudyQuestion,
  FillBlankQuestion,
  MatchQuestion,
  MCQItem,
  MCQQuestion,
  Question,
  RichQuestion,
  SubjectiveQuestion,
  TrueFalseQuestion,
} from "@/lib/paper/types";
import { uid } from "@/lib/paper/factory";
import { ContentEditor } from "./ContentEditor";

type QProps<T> = { q: T; onChange: (q: T) => void };

function SmallBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-0.5 text-xs ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "text-stone-700 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <span className="w-6 shrink-0 text-xs text-stone-500">{children}</span>;
}

// ---------------- MCQ (shared item editor reused by case study) ----------------

function MCQItemEditor({
  item,
  n,
  onChange,
  onRemove,
}: {
  item: MCQItem;
  n: number;
  onChange: (it: MCQItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded border bg-stone-50 p-2">
      <div className="flex items-center gap-2">
        <RowLabel>{n})</RowLabel>
        <div className="flex-1">
          <ContentEditor
            value={item.stem}
            placeholder="Question text"
            onChange={(stem) => onChange({ ...item, stem })}
          />
        </div>
        <SmallBtn danger onClick={onRemove}>
          ✕
        </SmallBtn>
      </div>
      <div className="mt-2 space-y-1 pl-6">
        {item.options.map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            <input
              value={o.label}
              onChange={(e) =>
                onChange({
                  ...item,
                  options: item.options.map((x) =>
                    x.id === o.id ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
              className="w-8 rounded border px-1 text-center text-sm"
            />
            <div className="flex-1">
              <ContentEditor
                value={o.content}
                placeholder="Option (text and/or image)"
                onChange={(content) =>
                  onChange({
                    ...item,
                    options: item.options.map((x) =>
                      x.id === o.id ? { ...x, content } : x,
                    ),
                  })
                }
              />
            </div>
            <label className="flex items-center gap-1 text-xs text-stone-500">
              <input
                type="radio"
                name={`correct-${item.id}`}
                checked={item.correctOptionId === o.id}
                onChange={() => onChange({ ...item, correctOptionId: o.id })}
              />
              correct
            </label>
            <SmallBtn
              danger
              onClick={() =>
                onChange({
                  ...item,
                  options: item.options.filter((x) => x.id !== o.id),
                })
              }
            >
              ✕
            </SmallBtn>
          </div>
        ))}
        <SmallBtn
          onClick={() =>
            onChange({
              ...item,
              options: [
                ...item.options,
                {
                  id: uid("op"),
                  label: String.fromCharCode(97 + item.options.length),
                  content: { text: "" },
                },
              ],
            })
          }
        >
          + option
        </SmallBtn>
      </div>
    </div>
  );
}

function mcqItemsEditor(
  items: MCQItem[],
  set: (items: MCQItem[]) => void,
) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <MCQItemEditor
          key={item.id}
          item={item}
          n={i + 1}
          onChange={(it) => set(items.map((x) => (x.id === it.id ? it : x)))}
          onRemove={() => set(items.filter((x) => x.id !== item.id))}
        />
      ))}
      <SmallBtn
        onClick={() =>
          set([
            ...items,
            {
              id: uid("mi"),
              stem: { text: "" },
              options: [
                { id: uid("op"), label: "a", content: { text: "" } },
                { id: uid("op"), label: "b", content: { text: "" } },
                { id: uid("op"), label: "c", content: { text: "" } },
              ],
            },
          ])
        }
      >
        + question
      </SmallBtn>
    </div>
  );
}

function MCQEditor({ q, onChange }: QProps<MCQQuestion>) {
  return mcqItemsEditor(q.items, (items) => onChange({ ...q, items }));
}

// ---------------- Fill in the blanks ----------------

function FillBlankEditor({ q, onChange }: QProps<FillBlankQuestion>) {
  return (
    <div className="space-y-2">
      <input
        value={(q.wordBank ?? []).join(", ")}
        placeholder="Word bank (comma separated) — optional"
        onChange={(e) =>
          onChange({
            ...q,
            wordBank: e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        className="w-full rounded border px-2 py-1 text-sm"
      />
      {q.items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <RowLabel>{String.fromCharCode(97 + i)})</RowLabel>
          <input
            value={it.text}
            placeholder="Use ____ for the blank"
            onChange={(e) =>
              onChange({
                ...q,
                items: q.items.map((x) =>
                  x.id === it.id ? { ...x, text: e.target.value } : x,
                ),
              })
            }
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <SmallBtn
            danger
            onClick={() => onChange({ ...q, items: q.items.filter((x) => x.id !== it.id) })}
          >
            ✕
          </SmallBtn>
        </div>
      ))}
      <SmallBtn
        onClick={() => onChange({ ...q, items: [...q.items, { id: uid("fb"), text: "" }] })}
      >
        + item
      </SmallBtn>
    </div>
  );
}

// ---------------- True / False ----------------

function TrueFalseEditor({ q, onChange }: QProps<TrueFalseQuestion>) {
  return (
    <div className="space-y-2">
      {q.items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <RowLabel>{i + 1}.</RowLabel>
          <input
            value={it.text}
            placeholder="Statement"
            onChange={(e) =>
              onChange({
                ...q,
                items: q.items.map((x) =>
                  x.id === it.id ? { ...x, text: e.target.value } : x,
                ),
              })
            }
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <select
            value={it.answer === undefined ? "" : it.answer ? "T" : "F"}
            onChange={(e) =>
              onChange({
                ...q,
                items: q.items.map((x) =>
                  x.id === it.id
                    ? { ...x, answer: e.target.value === "" ? undefined : e.target.value === "T" }
                    : x,
                ),
              })
            }
            className="rounded border px-1 text-xs"
            title="Answer key"
          >
            <option value="">—</option>
            <option value="T">True</option>
            <option value="F">False</option>
          </select>
          <SmallBtn
            danger
            onClick={() => onChange({ ...q, items: q.items.filter((x) => x.id !== it.id) })}
          >
            ✕
          </SmallBtn>
        </div>
      ))}
      <SmallBtn
        onClick={() => onChange({ ...q, items: [...q.items, { id: uid("tf"), text: "" }] })}
      >
        + item
      </SmallBtn>
    </div>
  );
}

// ---------------- Match the following (images supported both columns) ----------------

function MatchEditor({ q, onChange }: QProps<MatchQuestion>) {
  const rows = Math.max(q.left.length, q.right.length);
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <RowLabel>{String.fromCharCode(97 + i)})</RowLabel>
          <div className="flex-1">
            {q.left[i] ? (
              <ContentEditor
                value={q.left[i].content}
                placeholder="Left (text/image)"
                onChange={(content) =>
                  onChange({
                    ...q,
                    left: q.left.map((x, j) => (j === i ? { ...x, content } : x)),
                  })
                }
              />
            ) : (
              <span className="text-xs text-stone-400">—</span>
            )}
          </div>
          <span className="text-stone-400">↔</span>
          <div className="flex-1">
            {q.right[i] ? (
              <ContentEditor
                value={q.right[i].content}
                placeholder="Right (text/image)"
                onChange={(content) =>
                  onChange({
                    ...q,
                    right: q.right.map((x, j) => (j === i ? { ...x, content } : x)),
                  })
                }
              />
            ) : (
              <span className="text-xs text-stone-400">—</span>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <SmallBtn
          onClick={() =>
            onChange({ ...q, left: [...q.left, { id: uid("ml"), content: { text: "" } }] })
          }
        >
          + left
        </SmallBtn>
        <SmallBtn
          onClick={() =>
            onChange({ ...q, right: [...q.right, { id: uid("mr"), content: { text: "" } }] })
          }
        >
          + right
        </SmallBtn>
        <SmallBtn
          danger
          onClick={() =>
            onChange({ ...q, left: q.left.slice(0, -1), right: q.right.slice(0, -1) })
          }
        >
          − row
        </SmallBtn>
      </div>
    </div>
  );
}

// ---------------- Subjective (very short / short / long) ----------------

function SubjectiveEditor({ q, onChange }: QProps<SubjectiveQuestion>) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-stone-500">
        Style:{" "}
        <select
          value={q.style}
          onChange={(e) =>
            onChange({ ...q, style: e.target.value as SubjectiveQuestion["style"] })
          }
          className="rounded border px-1 text-xs"
        >
          <option value="very_short">Very short</option>
          <option value="short">Short</option>
          <option value="long">Long</option>
        </select>
      </label>
      {q.items.map((it, i) => (
        <div key={it.id} className="flex items-start gap-2">
          <RowLabel>{i + 1}.</RowLabel>
          <div className="flex-1">
            <ContentEditor
              value={it.content}
              placeholder="Question (text/image)"
              onChange={(content) =>
                onChange({
                  ...q,
                  items: q.items.map((x) => (x.id === it.id ? { ...x, content } : x)),
                })
              }
            />
          </div>
          <label className="text-xs text-stone-500">
            lines
            <input
              type="number"
              min={0}
              value={it.answerLines ?? 0}
              onChange={(e) =>
                onChange({
                  ...q,
                  items: q.items.map((x) =>
                    x.id === it.id ? { ...x, answerLines: Number(e.target.value) || 0 } : x,
                  ),
                })
              }
              className="ml-1 w-12 rounded border px-1"
            />
          </label>
          <SmallBtn
            danger
            onClick={() => onChange({ ...q, items: q.items.filter((x) => x.id !== it.id) })}
          >
            ✕
          </SmallBtn>
        </div>
      ))}
      <SmallBtn
        onClick={() =>
          onChange({
            ...q,
            items: [...q.items, { id: uid("si"), content: { text: "" }, answerLines: 2 }],
          })
        }
      >
        + item
      </SmallBtn>
    </div>
  );
}

// ---------------- Case study ----------------

function CaseStudyEditor({ q, onChange }: QProps<CaseStudyQuestion>) {
  return (
    <div className="space-y-2">
      <ContentEditor
        value={q.passage}
        multiline
        placeholder="Passage / data for the case"
        onChange={(passage) => onChange({ ...q, passage })}
      />
      <div className="pl-2">
        {mcqItemsEditor(q.questions, (questions) => onChange({ ...q, questions }))}
      </div>
    </div>
  );
}

// ---------------- Rich / free block ----------------

function RichEditor({ q, onChange }: QProps<RichQuestion>) {
  return (
    <div className="space-y-2">
      <ContentEditor
        value={q.content}
        multiline
        placeholder="Free text and/or an uploaded image (abacus, number strip, column sums, etc.)"
        onChange={(content) => onChange({ ...q, content })}
      />
      <label className="text-xs text-stone-500">
        Blank space (px):
        <input
          type="number"
          min={0}
          value={q.blankSpace ?? 0}
          onChange={(e) => onChange({ ...q, blankSpace: Number(e.target.value) || 0 })}
          className="ml-1 w-16 rounded border px-1"
        />
      </label>
    </div>
  );
}

// ---------------- Dispatcher ----------------

export function QuestionBodyEditor({
  q,
  onChange,
}: {
  q: Question;
  onChange: (q: Question) => void;
}) {
  switch (q.type) {
    case "mcq":
      return <MCQEditor q={q} onChange={onChange} />;
    case "fill_blank":
      return <FillBlankEditor q={q} onChange={onChange} />;
    case "true_false":
      return <TrueFalseEditor q={q} onChange={onChange} />;
    case "match":
      return <MatchEditor q={q} onChange={onChange} />;
    case "subjective":
      return <SubjectiveEditor q={q} onChange={onChange} />;
    case "case_study":
      return <CaseStudyEditor q={q} onChange={onChange} />;
    case "rich":
      return <RichEditor q={q} onChange={onChange} />;
  }
}
