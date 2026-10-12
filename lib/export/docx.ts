import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type {
  Content,
  ImageRef,
  MCQItem,
  PaperDoc,
  Question,
} from "@/lib/paper/types";
import { marksTotal, paperTotalMarks } from "@/lib/paper/types";

/** Decode a data: or http(s) image URL into bytes + type for docx ImageRun. */
async function loadImage(
  img: ImageRef,
): Promise<{ data: Uint8Array; type: "png" | "jpg" | "gif"; width: number } | null> {
  try {
    let bytes: Uint8Array;
    let mime = "";
    if (img.url.startsWith("data:")) {
      const [header, b64] = img.url.split(",");
      mime = header.slice(5, header.indexOf(";"));
      bytes = Uint8Array.from(Buffer.from(b64, "base64"));
    } else if (img.url.startsWith("http")) {
      const res = await fetch(img.url);
      mime = res.headers.get("content-type") ?? "image/png";
      bytes = new Uint8Array(await res.arrayBuffer());
    } else {
      return null;
    }
    const type = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : mime.includes("gif") ? "gif" : "png";
    const width = img.width ?? 60;
    return { data: bytes, type, width };
  } catch {
    return null;
  }
}

async function contentRuns(c: Content): Promise<(TextRun | ImageRun)[]> {
  const runs: (TextRun | ImageRun)[] = [];
  if (c.text) runs.push(new TextRun(c.text));
  if (c.image?.url) {
    const img = await loadImage(c.image);
    if (img) {
      runs.push(
        new ImageRun({
          data: img.data,
          type: img.type,
          transformation: { width: img.width, height: img.width },
        }),
      );
    }
  }
  return runs;
}

const para = (children: (TextRun | ImageRun)[], opts: object = {}) =>
  new Paragraph({ children, spacing: { after: 60 }, ...opts });

const line = (text: string, opts: object = {}) =>
  new Paragraph({ children: [new TextRun(text)], spacing: { after: 60 }, ...opts });

async function mcqItemParas(item: MCQItem, n: number): Promise<Paragraph[]> {
  const stem = await contentRuns(item.stem);
  const paras: Paragraph[] = [
    para([new TextRun({ text: `${n}) `, bold: false }), ...stem]),
  ];
  const optRuns: (TextRun | ImageRun)[] = [];
  for (const o of item.options) {
    optRuns.push(new TextRun({ text: `   ${o.label}) ` }));
    optRuns.push(...(await contentRuns(o.content)));
  }
  paras.push(new Paragraph({ children: optRuns, spacing: { after: 100 }, indent: { left: 360 } }));
  return paras;
}

async function questionParas(q: Question, index: number): Promise<(Paragraph | Table)[]> {
  const out: (Paragraph | Table)[] = [];
  const total = marksTotal(q.marks);
  const head = new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [
      new TextRun({ text: `Q${index}. ${q.prompt}`, bold: true }),
      ...(q.note ? [new TextRun({ text: ` ${q.note}`, italics: true })] : []),
      new TextRun({ text: `\t${q.marks.count} × ${q.marks.per} = ${total}`, bold: true }),
    ],
    tabStops: [{ type: "right", position: 9000 }],
  });
  out.push(head);

  switch (q.type) {
    case "mcq":
      for (let i = 0; i < q.items.length; i++) out.push(...(await mcqItemParas(q.items[i], i + 1)));
      break;
    case "fill_blank":
      if (q.wordBank?.length) out.push(line(`{ ${q.wordBank.join(", ")} }`));
      q.items.forEach((it, i) =>
        out.push(line(`${String.fromCharCode(97 + i)}) ${it.text}`, { indent: { left: 360 } })),
      );
      break;
    case "true_false":
      q.items.forEach((it, i) =>
        out.push(line(`${i + 1}. ${it.text} __________`, { indent: { left: 360 } })),
      );
      break;
    case "match": {
      const rows = Math.max(q.left.length, q.right.length);
      const tableRows: TableRow[] = [];
      for (let i = 0; i < rows; i++) {
        const l = q.left[i] ? await contentRuns(q.left[i].content) : [new TextRun("")];
        const r = q.right[i] ? await contentRuns(q.right[i].content) : [new TextRun("")];
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [para([new TextRun(`${String.fromCharCode(97 + i)})`)])], width: { size: 8, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [para(l)], width: { size: 42, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [para(r)], width: { size: 50, type: WidthType.PERCENTAGE } }),
            ],
          }),
        );
      }
      out.push(
        new Table({
          rows: tableRows,
          width: { size: 80, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
        }),
      );
      break;
    }
    case "subjective":
      for (let i = 0; i < q.items.length; i++) {
        const it = q.items[i];
        out.push(para([new TextRun(`${i + 1}. `), ...(await contentRuns(it.content))], { indent: { left: 360 } }));
        for (let k = 0; k < (it.answerLines ?? 0); k++) {
          out.push(line("_________________________________________________________", { indent: { left: 360 } }));
        }
      }
      break;
    case "case_study":
      out.push(para(await contentRuns(q.passage)));
      for (let i = 0; i < q.questions.length; i++) out.push(...(await mcqItemParas(q.questions[i], i + 1)));
      break;
    case "rich":
      out.push(para(await contentRuns(q.content)));
      if (q.blankSpace) {
        const lines = Math.ceil(q.blankSpace / 24);
        for (let k = 0; k < lines; k++) out.push(line(""));
      }
      break;
  }
  return out;
}

/** A faint, repeated watermark line for the page header/footer (shows on every page). */
function watermarkParagraph(text: string): Paragraph {
  const tile = `${text}      `.repeat(3);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: tile, color: "D9D9D9", bold: true, size: 36 })],
  });
}

/** Build a .docx Buffer from a PaperDoc. Pass a watermark to stamp every page. */
export async function paperToDocx(
  doc: PaperDoc,
  opts: { watermark?: string } = {},
): Promise<Buffer> {
  const h = doc.header;
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: h.schoolName.toUpperCase(), bold: true })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h.examTitle, bold: true })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun(`CLASS – ${h.className}     SUBJECT – ${h.subject}`)],
    }),
    new Paragraph({
      spacing: { after: 120 },
      tabStops: [{ type: "right", position: 9000 }],
      children: [new TextRun(`Time: ${h.time}\tMax Marks: ${h.marksTable?.total ?? paperTotalMarks(doc)}`)],
    }),
    // Name/Roll stacked, one per line.
    ...h.fields.map(
      (f) =>
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun(`${f.label}: ______________________`)],
        }),
    ),
  ];

  for (const section of doc.sections) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 80 },
        children: [new TextRun({ text: section.title, bold: true, underline: {} })],
      }),
    );
    let qi = 1;
    for (const q of section.questions) {
      children.push(...(await questionParas(q, qi)));
      qi += 1;
    }
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
      children: [new TextRun({ text: "— End of Question Paper —", bold: true })],
    }),
  );

  const wm = opts.watermark
    ? {
        headers: {
          default: new Header({
            children: [watermarkParagraph(opts.watermark), watermarkParagraph(opts.watermark)],
          }),
        },
        footers: {
          default: new Footer({ children: [watermarkParagraph(opts.watermark)] }),
        },
      }
    : {};

  const document = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } } },
    sections: [{ properties: {}, ...wm, children }],
  });
  return Packer.toBuffer(document);
}
