import type { PaperDoc } from "@/lib/paper/types";

const LOCAL_KEY = "qp:local";

/** Does the guest's local paper have real content worth keeping? */
export function guestPaperHasContent(doc: PaperDoc): boolean {
  const hasQuestions = (doc.sections ?? []).some((s) => (s.questions ?? []).length > 0);
  return hasQuestions || doc.title !== "Untitled Question Paper";
}

/**
 * If a guest built a paper at /editor/local, import it into the now-signed-in
 * account so their work isn't lost. Returns the new paper id, or null.
 */
export async function migrateGuestPaper(): Promise<string | null> {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (!s) return null;
    const doc = JSON.parse(s) as PaperDoc;
    if (!guestPaperHasContent(doc)) return null;

    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc }),
    });
    if (!res.ok) return null;
    const { id } = (await res.json()) as { id: string };
    localStorage.removeItem(LOCAL_KEY);
    return id;
  } catch {
    return null;
  }
}
