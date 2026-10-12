import type { PaperDoc } from "./types";
import { uid } from "./factory";

const t = (text: string) => ({ text });

/** A sample paper reproducing the real Class-1 Maths first-term exam, covering every question type. */
export function samplePaper(): PaperDoc {
  return {
    title: "Class 1 Maths — First Term Exam 2026-27",
    header: {
      schoolName: "Saraswati Shishu Vidhya Mandir Sr. Sec. School",
      examTitle: "First Term Examination 2026-27",
      className: "1st",
      subject: "Maths",
      time: "3:00 hrs",
      marksTable: { written: 80, oral: 20, total: 100 },
      fields: [
        { id: uid("f"), label: "Name" },
        { id: uid("f"), label: "Roll No." },
      ],
    },
    sections: [
      {
        id: uid("sec"),
        title: "Section A",
        questions: [
          {
            id: uid("q"),
            type: "mcq",
            prompt: "Tick (✓) the correct answer.",
            marks: { count: 6, per: 1 },
            items: [
              {
                id: uid("mi"),
                stem: t("Tick the smallest number."),
                options: [
                  { id: uid("op"), label: "a", content: t("9") },
                  { id: uid("op"), label: "b", content: t("4") },
                  { id: uid("op"), label: "c", content: t("6") },
                ],
                correctOptionId: undefined,
              },
              {
                id: uid("mi"),
                stem: t("Correct spelling of 6 is"),
                options: [
                  { id: uid("op"), label: "a", content: t("seven") },
                  { id: uid("op"), label: "b", content: t("six") },
                  { id: uid("op"), label: "c", content: t("eleven") },
                ],
              },
              {
                id: uid("mi"),
                stem: t("6 + 3 = ______"),
                options: [
                  { id: uid("op"), label: "a", content: t("8") },
                  { id: uid("op"), label: "b", content: t("6") },
                  { id: uid("op"), label: "c", content: t("9") },
                ],
              },
            ],
          },
          {
            id: uid("q"),
            type: "fill_blank",
            prompt: "Fill in the blanks.",
            marks: { count: 5, per: 1 },
            wordBank: ["forty five", "36", "10", "06", "1924", "18"],
            items: [
              { id: uid("fb"), text: "Which number is biggest number 36 or 32? ______" },
              { id: uid("fb"), text: "The number before 20 is ______" },
              { id: uid("fb"), text: "33 comes after ______" },
              { id: uid("fb"), text: "7 + 3 equals ______" },
              { id: uid("fb"), text: "The number name of 45 is ______" },
            ],
          },
          {
            id: uid("q"),
            type: "true_false",
            prompt: "Write True (✓) or False (✗).",
            marks: { count: 6, per: 1 },
            items: [
              { id: uid("tf"), text: "The numeral for twenty five is 20." },
              { id: uid("tf"), text: "11 comes after 20." },
              { id: uid("tf"), text: "3 + 0 = 0." },
              { id: uid("tf"), text: "7 − 6 = 1." },
              { id: uid("tf"), text: "24 is bigger than 56." },
            ],
          },
          {
            id: uid("q"),
            type: "match",
            prompt: "Match the following.",
            marks: { count: 6, per: 1 },
            left: [
              { id: uid("ml"), content: t("Thirty one") },
              { id: uid("ml"), content: t("6 + 4") },
              { id: uid("ml"), content: t("16") },
              { id: uid("ml"), content: t("26 ___ 28") },
              { id: uid("ml"), content: t("2") },
              { id: uid("ml"), content: t("6 − 0") },
            ],
            right: [
              { id: uid("mr"), content: t("sixteen") },
              { id: uid("mr"), content: t("1 + 1") },
              { id: uid("mr"), content: t("6") },
              { id: uid("mr"), content: t("31") },
              { id: uid("mr"), content: t("10") },
              { id: uid("mr"), content: t("43") },
            ],
          },
        ],
      },
      {
        id: uid("sec"),
        title: "Section B",
        questions: [
          {
            id: uid("q"),
            type: "subjective",
            prompt: "Very short answer type questions.",
            style: "very_short",
            marks: { count: 7, per: 2 },
            items: [
              { id: uid("si"), content: t("Circle the smallest number: 12 , 42 , 26"), answerLines: 0 },
              { id: uid("si"), content: t("Write the correct symbol (>  <  =):  35 ___ 17"), answerLines: 0 },
              { id: uid("si"), content: t("Write the number name: 36 –"), answerLines: 1 },
            ],
          },
          {
            id: uid("q"),
            type: "subjective",
            prompt: "Short answer type questions.",
            style: "short",
            marks: { count: 6, per: 3 },
            items: [
              { id: uid("si"), content: t("Arrange in increasing order: 35, 65, 55, 25"), answerLines: 1 },
              { id: uid("si"), content: t("Arrange in descending order: 42, 67, 12, 25"), answerLines: 1 },
            ],
          },
          {
            id: uid("q"),
            type: "rich",
            prompt: "Write the number represented by the beads on the abacus.",
            marks: { count: 2, per: 1 },
            content: t("(Insert the abacus image here using the + Image button.)"),
            blankSpace: 80,
          },
        ],
      },
      {
        id: uid("sec"),
        title: "Section C",
        questions: [
          {
            id: uid("q"),
            type: "subjective",
            prompt: "Long questions.",
            note: "(any four)",
            style: "long",
            marks: { count: 4, per: 5 },
            items: [
              { id: uid("si"), content: t("Rajiv had 8 apples, he ate 5 of them. How many apples are left with him?"), answerLines: 3 },
              { id: uid("si"), content: t("Rahul had 3 books and took 2 more in his hand. How many books did he take?"), answerLines: 3 },
              { id: uid("si"), content: t("Draw two pictures each of long and short objects and colour them."), answerLines: 4 },
            ],
          },
        ],
      },
      {
        id: uid("sec"),
        title: "Section D",
        questions: [
          {
            id: uid("q"),
            type: "case_study",
            prompt: "Read and answer the following questions.",
            marks: { count: 4, per: 1 },
            passage: t(
              "There are four students in a class:\nRam – Roll no. 10\nArav – Roll no. 12\nMeera – Roll no. 15\nRanu – Roll no. 18",
            ),
            questions: [
              {
                id: uid("mi"),
                stem: t("What is the roll number of Meera?"),
                options: [
                  { id: uid("op"), label: "a", content: t("15") },
                  { id: uid("op"), label: "b", content: t("18") },
                  { id: uid("op"), label: "c", content: t("10") },
                ],
              },
              {
                id: uid("mi"),
                stem: t("What is the roll number of Aarav?"),
                options: [
                  { id: uid("op"), label: "a", content: t("18") },
                  { id: uid("op"), label: "b", content: t("15") },
                  { id: uid("op"), label: "c", content: t("12") },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
