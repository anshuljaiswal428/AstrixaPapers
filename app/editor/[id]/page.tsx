"use client";

import { use, useEffect, useState } from "react";
import type { PaperDoc } from "@/lib/paper/types";
import { newPaper } from "@/lib/paper/factory";
import { Editor } from "@/components/editor/Editor";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [doc, setDoc] = useState<PaperDoc | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Public demo ids (no DB): start from a blank paper, saved in the browser.
      if (id === "sample" || id === "local") {
        const saved = localStorage.getItem(`qp:${id}`);
        return setDoc(saved ? (JSON.parse(saved) as PaperDoc) : newPaper());
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

  if (!doc) {
    return (
      <div className="flex h-screen items-center justify-center text-stone-500">Loading…</div>
    );
  }
  return <Editor paperId={id} initialDoc={doc} />;
}
