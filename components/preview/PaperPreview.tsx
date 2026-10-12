import type {
  CaseStudyQuestion,
  Content,
  FillBlankQuestion,
  MatchQuestion,
  MCQItem,
  MCQQuestion,
  PaperDoc,
  Question,
  RichQuestion,
  SubjectiveQuestion,
  TrueFalseQuestion,
} from "@/lib/paper/types";
import { marksTotal, paperTotalMarks } from "@/lib/paper/types";

/**
 * Pure, server-safe renderer that turns a PaperDoc into the printed-paper look.
 * Shared by the editor preview pane and the print/PDF route.
 */
/** Build a repeating diagonal watermark background (tiled SVG) for every printed page. */
function watermarkStyle(text: string): React.CSSProperties {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='240'><text x='20' y='140' font-family='Arial, sans-serif' font-size='24' font-weight='700' fill='#000000' fill-opacity='0.08' transform='rotate(-30 180 120)'>${text}</text></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return { backgroundImage: url, backgroundRepeat: "repeat" };
}

export function PaperPreview({
  doc,
  watermark,
  /** true (print): fixed layer tiles every page. false (editor): contained within the paper. */
  watermarkFixed = true,
}: {
  doc: PaperDoc;
  watermark?: string;
  watermarkFixed?: boolean;
}) {
  return (
    <div className="qp-paper">
      {watermark ? (
        <div
          className={watermarkFixed ? "qp-watermark" : "qp-watermark-contained"}
          aria-hidden
          style={watermarkStyle(watermark)}
        />
      ) : null}
      <Header doc={doc} />
      {doc.sections.map((section) => (
        <section key={section.id} className="qp-section">
          <h2 className="qp-section-title">{section.title}</h2>
          {section.questions.map((q, i) => (
            <QuestionView key={q.id} q={q} index={i + 1} />
          ))}
        </section>
      ))}
      <p className="qp-end">— End of Question Paper —</p>
    </div>
  );
}

function Header({ doc }: { doc: PaperDoc }) {
  const h = doc.header;
  const total = paperTotalMarks(doc);
  return (
    <header className="qp-header">
      {h.marksTable && (
        <table className="qp-marks-table">
          <tbody>
            <tr>
              <td>W</td>
              <td>O</td>
              <td>T</td>
            </tr>
            <tr>
              <td>{h.marksTable.written ?? ""}</td>
              <td>{h.marksTable.oral ?? ""}</td>
              <td>{h.marksTable.total ?? ""}</td>
            </tr>
          </tbody>
        </table>
      )}
      <div className="qp-school">{h.schoolName}</div>
      <div className="qp-exam">{h.examTitle}</div>
      <div className="qp-line">CLASS – {h.className}</div>
      <div className="qp-line">SUBJECT – {h.subject}</div>

      <div className="qp-header-bottom">
        <div className="qp-fields">
          {h.fields.map((f) => (
            <div key={f.id} className="qp-field">
              {f.label} - <span className="qp-blank" />
            </div>
          ))}
        </div>
        <div className="qp-right-meta">
          <div>Max Marks: {h.marksTable?.total ?? total}</div>
          <div>Time: {h.time}</div>
        </div>
      </div>
    </header>
  );
}

function MarksTag({ q }: { q: Question }) {
  const total = marksTotal(q.marks);
  if (!total && !q.marks.count) return null;
  return (
    <span className="qp-marks">
      {q.marks.count} × {q.marks.per} = {total}
    </span>
  );
}

function ContentView({ c }: { c: Content }) {
  return (
    <span className="qp-content">
      {c.text ? <span>{c.text}</span> : null}
      {c.image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="qp-img"
          src={c.image.url}
          alt={c.image.alt ?? ""}
          style={c.image.width ? { width: c.image.width } : undefined}
        />
      ) : null}
    </span>
  );
}

function QuestionView({ q, index }: { q: Question; index: number }) {
  return (
    <div className="qp-q">
      <div className="qp-q-head">
        <span className="qp-q-label">
          Q{index}. {q.prompt}
          {q.note ? <em className="qp-note"> {q.note}</em> : null}
        </span>
        <MarksTag q={q} />
      </div>
      <div className="qp-q-body">
        <QuestionBody q={q} />
      </div>
    </div>
  );
}

function QuestionBody({ q }: { q: Question }) {
  switch (q.type) {
    case "mcq":
      return <MCQView q={q} />;
    case "fill_blank":
      return <FillBlankView q={q} />;
    case "true_false":
      return <TrueFalseView q={q} />;
    case "match":
      return <MatchView q={q} />;
    case "subjective":
      return <SubjectiveView q={q} />;
    case "case_study":
      return <CaseStudyView q={q} />;
    case "rich":
      return <RichView q={q} />;
  }
}

function MCQItemView({ item, n }: { item: MCQItem; n: number }) {
  return (
    <div className="qp-mcq-item">
      <div className="qp-mcq-stem">
        <span className="qp-sub-n">{n})</span>
        <ContentView c={item.stem} />
      </div>
      <div className="qp-options">
        {item.options.map((o) => (
          <span key={o.id} className="qp-option">
            <span className="qp-opt-label">{o.label})</span>
            <ContentView c={o.content} />
          </span>
        ))}
      </div>
    </div>
  );
}

function MCQView({ q }: { q: MCQQuestion }) {
  return (
    <div>
      {q.items.map((item, i) => (
        <MCQItemView key={item.id} item={item} n={i + 1} />
      ))}
    </div>
  );
}

function FillBlankView({ q }: { q: FillBlankQuestion }) {
  return (
    <div>
      {q.wordBank && q.wordBank.length > 0 && (
        <div className="qp-wordbank">{`{ ${q.wordBank.join(", ")} }`}</div>
      )}
      <ol className="qp-list qp-alpha">
        {q.items.map((it) => (
          <li key={it.id}>{it.text}</li>
        ))}
      </ol>
    </div>
  );
}

function TrueFalseView({ q }: { q: TrueFalseQuestion }) {
  return (
    <ol className="qp-list qp-num">
      {q.items.map((it) => (
        <li key={it.id}>
          {it.text} <span className="qp-blank-sm" />
        </li>
      ))}
    </ol>
  );
}

function MatchView({ q }: { q: MatchQuestion }) {
  const rows = Math.max(q.left.length, q.right.length);
  return (
    <table className="qp-match">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td className="qp-match-label">{String.fromCharCode(97 + i)})</td>
            <td className="qp-match-left">
              {q.left[i] ? <ContentView c={q.left[i].content} /> : null}
            </td>
            <td className="qp-match-dash">—</td>
            <td className="qp-match-right">
              {q.right[i] ? <ContentView c={q.right[i].content} /> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SubjectiveView({ q }: { q: SubjectiveQuestion }) {
  return (
    <ol className="qp-list qp-num">
      {q.items.map((it) => (
        <li key={it.id}>
          <ContentView c={it.content} />
          {it.answerLines
            ? Array.from({ length: it.answerLines }).map((_, i) => (
                <span key={i} className="qp-answer-line" />
              ))
            : null}
        </li>
      ))}
    </ol>
  );
}

function CaseStudyView({ q }: { q: CaseStudyQuestion }) {
  return (
    <div>
      <div className="qp-passage">
        <ContentView c={q.passage} />
      </div>
      <div className="qp-case-qs">
        {q.questions.map((item, i) => (
          <MCQItemView key={item.id} item={item} n={i + 1} />
        ))}
      </div>
    </div>
  );
}

function RichView({ q }: { q: RichQuestion }) {
  return (
    <div>
      <ContentView c={q.content} />
      {q.blankSpace ? <div style={{ height: q.blankSpace }} /> : null}
    </div>
  );
}
