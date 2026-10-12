// Core data model for the question-paper builder.
// A Paper is a tree: Paper -> Sections -> Questions -> (items / options).
// The whole document is stored as JSON (see Prisma `Paper.doc`), which keeps
// adding new question types cheap. Relational columns are only for listing.

/** An image reference. `url` may be a Supabase Storage public URL or a data: URL. */
export type ImageRef = {
  url: string;
  alt?: string;
  /** Optional display width in px for the preview/export. */
  width?: number;
};

/** A piece of content that can carry text and/or an image (used in MCQ options, match items, etc.). */
export type Content = {
  text?: string;
  image?: ImageRef;
};

/** Marks for a single question. Total is derived as count * per. */
export type Marks = {
  count: number;
  per: number;
};

export function marksTotal(m: Marks): number {
  return (m.count || 0) * (m.per || 0);
}

// ----------------------------------------------------------------------------
// Question types (discriminated union on `type`).
// Every question shares the fields in `QuestionBase`.
// ----------------------------------------------------------------------------

export type QuestionType =
  | "mcq"
  | "fill_blank"
  | "true_false"
  | "match"
  | "subjective"
  | "case_study"
  | "rich";

export type QuestionBase = {
  id: string;
  type: QuestionType;
  /** e.g. "Choose the correct option", "Fill in the blanks" */
  prompt: string;
  marks: Marks;
  /** e.g. "(any four)" shown next to the prompt. */
  note?: string;
};

/** One MCQ sub-question: a stem plus labelled options (a/b/c). Options may be text and/or image. */
export type MCQItem = {
  id: string;
  stem: Content;
  options: { id: string; label: string; content: Content }[];
  /** id of the correct option (for the optional answer key). */
  correctOptionId?: string;
};

export type MCQQuestion = QuestionBase & {
  type: "mcq";
  items: MCQItem[];
};

export type FillBlankQuestion = QuestionBase & {
  type: "fill_blank";
  /** Optional word bank shown as { a, b, c }. */
  wordBank?: string[];
  items: { id: string; text: string; answer?: string }[];
};

export type TrueFalseQuestion = QuestionBase & {
  type: "true_false";
  items: { id: string; text: string; answer?: boolean }[];
};

/** Match the following: two columns. Right column is shuffled on display; `answer` holds the true pairing. */
export type MatchQuestion = QuestionBase & {
  type: "match";
  left: { id: string; content: Content }[];
  right: { id: string; content: Content }[];
  answer?: { leftId: string; rightId: string }[];
};

/** Covers very-short / short / long answer. `style` drives spacing in the preview/export. */
export type SubjectiveQuestion = QuestionBase & {
  type: "subjective";
  style: "very_short" | "short" | "long";
  items: {
    id: string;
    content: Content;
    /** number of blank answer lines to render under this item. */
    answerLines?: number;
  }[];
};

/** Case-based: a passage (text and/or image) followed by MCQ-style sub-questions. */
export type CaseStudyQuestion = QuestionBase & {
  type: "case_study";
  passage: Content;
  questions: MCQItem[];
};

/** Free-form block: anything we don't model structurally (abacus diagram, number strip,
 *  T-O column sums, "draw & colour" boxes) — typed text and/or an uploaded image, plus blank space. */
export type RichQuestion = QuestionBase & {
  type: "rich";
  content: Content;
  /** extra vertical blank space in px for hand-written answers / drawings. */
  blankSpace?: number;
};

export type Question =
  | MCQQuestion
  | FillBlankQuestion
  | TrueFalseQuestion
  | MatchQuestion
  | SubjectiveQuestion
  | CaseStudyQuestion
  | RichQuestion;

// ----------------------------------------------------------------------------
// Sections and the Paper header.
// ----------------------------------------------------------------------------

export type Section = {
  id: string;
  /** e.g. "Section A" */
  title: string;
  questions: Question[];
};

export type PaperHeader = {
  schoolName: string;
  examTitle: string;
  className: string;
  subject: string;
  time: string;
  /** The small W/O/T marks grid seen on the papers. Any field optional. */
  marksTable?: { written?: number; oral?: number; total?: number };
  /** Blank fill-in fields printed on the paper, e.g. Name, Roll No. */
  fields: { id: string; label: string }[];
  logo?: ImageRef;
};

/** The full paper document stored in Paper.doc (JSON). */
export type PaperDoc = {
  title: string;
  header: PaperHeader;
  sections: Section[];
};

/** Sum of all question marks across the paper. */
export function paperTotalMarks(doc: PaperDoc): number {
  return doc.sections.reduce(
    (sum, s) => sum + s.questions.reduce((qs, q) => qs + marksTotal(q.marks), 0),
    0,
  );
}
