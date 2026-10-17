"use client";

import { useRouter } from "next/navigation";
import type { PaperTemplate } from "@/lib/templates";
import { TemplateGrid } from "@/components/TemplateGrid";

/** Template grid for the signed-in `/new` flow: creates a DB paper, then opens the editor. */
export function NewPaperTemplates({ templates }: { templates: PaperTemplate[] }) {
  const router = useRouter();

  async function create(templateId: string) {
    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });
    if (!res.ok) throw new Error(`Create failed (${res.status})`);
    const { id } = (await res.json()) as { id: string };
    router.push(`/editor/${id}`);
  }

  return <TemplateGrid templates={templates} onPick={create} />;
}
