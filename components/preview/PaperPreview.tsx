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
export function PaperPreview({ doc }: { doc: PaperDoc }) {
  return (
    <div className="qp-paper">
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
      <div className="qp-school">{h.schoolName}</div>
      <div className="qp-exam">{h.examTitle}</div>
      <div className="qp-meta-row">
        <span>
          CLASS – {h.className}
          {"  "}
          SUBJECT – {h.subject}
        </span>
      </div>
      <div className="qp-meta-row qp-meta-split">
        <span>Time: {h.time}</span>
        <span>Max Marks: {h.marksTable?.total ?? total}</span>
      </div>
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
      <div className="qp-fields">
        {h.fields.map((f) => (
          <span key={f.id} className="qp-field">
            {f.label}: <span className="qp-blank" />
          </span>
        ))}
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
