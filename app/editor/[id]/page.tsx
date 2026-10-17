"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { PaperDoc } from "@/lib/paper/types";
import { newPaper } from "@/lib/paper/factory";
import { TEMPLATES } from "@/lib/templates";
import { Editor } from "@/components/editor/Editor";
import { TemplateGrid } from "@/components/TemplateGrid";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [doc, setDoc] = useState<PaperDoc | null>(null);
  // Demo entry (local/sample) with no saved draft → pick a template before editing.
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Public demo ids (no DB): resume a saved draft, else start by choosing a template.
      if (id === "sample" || id === "local") {
        const saved = localStorage.getItem(`qp:${id}`);
        if (saved) {
          if (!cancelled) setDoc(JSON.parse(saved) as PaperDoc);
        } else if (!cancelled) {
          setChoosing(true);
        }
        return;
      }
      // Try the API (requires auth + DB); fall back to localStorage, then a blank paper.
      try {
        const res = await fetch(`/api/papers/${id}`);
        if (res.ok) {
          const data = (await res.json()) as { paper: { doc: PaperDoc } };
          if (!cancelled) setDoc(data.paper.doc);
          return;
        }
      } catch {
        /* fall through */
      }
      const saved = localStorage.getItem(`qp:${id}`);
      if (!cancelled) setDoc(saved ? (JSON.parse(saved) as PaperDoc) : newPaper());
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // User picked a template on the demo entry → seed a paper and open the editor.
  function startFromTemplate(templateId: string) {
    const d = newPaper(templateId);
    try {
      localStorage.setItem(`qp:${id}`, JSON.stringify(d));
    } catch {
      /* ignore quota errors */
    }
    setDoc(d);
    setChoosing(false);
  }

  if (choosing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
        <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                A
              </span>
              <span className="font-semibold text-stone-800">Paper Rankers</span>
            </span>
            <Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">
              ← Home
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-stone-900">Choose a template to start</h1>
            <p className="mt-1 text-sm text-stone-500">
              Pick a layout for your paper. You can switch it anytime from the editor toolbar.
            </p>
          </div>
          {/* No Suggest card here — uploading a sample needs a signed-in account. */}
          <TemplateGrid templates={TEMPLATES} onPick={startFromTemplate} showSuggest={false} />
        </main>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-screen items-center justify-center text-stone-500">Loading…</div>
    );
  }
  return <Editor paperId={id} initialDoc={doc} />;
}
