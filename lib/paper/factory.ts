import type {
  Content,
  MCQItem,
  Question,
  QuestionType,
  Section,
  PaperDoc,
} from "./types";

/** Small id generator that works in browser and node without Math.random being disallowed at runtime. */
let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(counter).padStart(6, "0");
  return `${prefix}_${rand}_${counter}`;
}

const emptyContent = (): Content => ({ text: "" });

function mcqItem(): MCQItem {
  return {
    id: uid("mi"),
    stem: emptyContent(),
    options: [
      { id: uid("op"), label: "a", content: emptyContent() },
      { id: uid("op"), label: "b", content: emptyContent() },
      { id: uid("op"), label: "c", content: emptyContent() },
    ],
  };
}

/** Create a blank question of the given type with sensible defaults. */
export function newQuestion(type: QuestionType): Question {
  const base = { id: uid("q"), prompt: "", marks: { count: 1, per: 1 } };
  switch (type) {
    case "mcq":
      return { ...base, type, prompt: "Choose the correct option.", items: [mcqItem()] };
    case "fill_blank":
      return {
        ...base,
        type,
        prompt: "Fill in the blanks.",
        wordBank: [],
        items: [{ id: uid("fb"), text: "" }],
      };
    case "true_false":
      return {
        ...base,
        type,
        prompt: "Write True or False.",
        items: [{ id: uid("tf"), text: "" }],
      };
    case "match":
      return {
        ...base,
        type,
        prompt: "Match the following.",
        left: [{ id: uid("ml"), content: emptyContent() }],
        right: [{ id: uid("mr"), content: emptyContent() }],
      };
    case "subjective":
      return {
        ...base,
        type,
        prompt: "Answer the following.",
        style: "short",
        marks: { count: 1, per: 2 },
        items: [{ id: uid("si"), content: emptyContent(), answerLines: 2 }],
      };
    case "case_study":
      return {
        ...base,
        type,
        prompt: "Read and answer the following questions.",
        passage: emptyContent(),
        questions: [mcqItem()],
      };
    case "rich":
      return { ...base, type, prompt: "", content: emptyContent(), blankSpace: 80 };
  }
}

export function newSection(title: string): Section {
  return { id: uid("sec"), title, questions: [] };
}

/** A blank paper with just a header and Section A. */
export function newPaper(): PaperDoc {
  return {
    title: "Untitled Question Paper",
    header: {
      schoolName: "SCHOOL NAME",
      examTitle: "FIRST TERM EXAM 2026-27",
      className: "1st",
      subject: "MATHS",
      time: "3 hrs.",
      marksTable: { written: 80, oral: 20, total: 100 },
      fields: [
        { id: uid("f"), label: "Name" },
        { id: uid("f"), label: "Roll No." },
      ],
    },
    sections: [newSection("Section A")],
  };
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple choice (MCQ)",
  fill_blank: "Fill in the blanks",
  true_false: "True / False",
  match: "Match the following",
  subjective: "Short / Long answer",
  case_study: "Case-based",
  rich: "Free block / image",
};
