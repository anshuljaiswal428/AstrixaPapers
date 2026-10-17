/**
 * Registry of question-paper layout templates shown in the "New paper" picker.
 *
 * Today only `template-1` (the classic centered-header layout rendered by
 * PaperPreview / exported by lib/export/docx.ts) is live. Add future layouts
 * here with `available: true` once their renderer/export variants exist.
 */
export type PaperTemplate = {
  id: string;
  name: string;
  /** One-line summary shown under the name in the grid. */
  description: string;
  /** Whether the user can pick it now (false → shown as a greyed "Coming soon" tile). */
  available: boolean;
  /** Short tags rendered as little chips on the card. */
  tags: string[];
};

export const TEMPLATES: PaperTemplate[] = [
  {
    id: "template-1",
    name: "Classic",
    description: "Centered school header with W/O/T marks box — the standard board-exam look.",
    available: true,
    tags: ["Header line", "W/O/T box", "PDF + Word"],
  },
  {
    id: "template-2",
    name: "Compact",
    description: "Tighter header and two-column sections to fit more questions per page.",
    available: false,
    tags: ["Coming soon"],
  },
  {
    id: "template-3",
    name: "Bordered",
    description: "Full page border with a boxed header block and ruled answer areas.",
    available: false,
    tags: ["Coming soon"],
  },
];

export function getTemplate(id: string): PaperTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** The template a paper uses when none is specified. */
export const DEFAULT_TEMPLATE_ID = "template-1";
