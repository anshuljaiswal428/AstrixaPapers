import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewPaperButton } from "@/components/NewPaperButton";
import { paperTotalMarks } from "@/lib/paper/types";
import type { PaperDoc } from "@/lib/paper/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined;
  if (!user?.id) redirect("/login?callbackUrl=/dashboard");

  const rows = await prisma.paper.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, className: true, subject: true, updatedAt: true, doc: true },
  });

  const papers = rows.map((p) => {
    const doc = p.doc as unknown as PaperDoc;
    const questions = doc.sections?.reduce((n, s) => n + (s.questions?.length ?? 0), 0) ?? 0;
    return {
      id: p.id,
      title: p.title,
      className: p.className,
      subject: p.subject,
      updatedAt: p.updatedAt,
      marks: paperTotalMarks(doc),
      questions,
      sections: doc.sections?.length ?? 0,
    };
  });

  const totalMarks = papers.reduce((n, p) => n + p.marks, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              A
            </span>
            <span className="font-semibold text-stone-800">Astrixa Papers</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/orders"
              className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100"
            >
              My downloads
            </Link>
            <span
              className="ml-2 grid h-8 w-8 place-items-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700"
              title={user.name}
            >
              {initials(user.name ?? "U")}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-lg px-3 py-1.5 text-stone-500 hover:bg-stone-100">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Hero */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {user.name?.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-indigo-100">
              Design question papers, insert images, and export to PDF or Word.
            </p>
          </div>
          <NewPaperButton />
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Papers" value={papers.length} />
          <Stat label="Total questions" value={papers.reduce((n, p) => n + p.questions, 0)} />
          <Stat label="Total marks" value={totalMarks} />
        </div>

        {/* Papers */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">Your papers</h2>
          <span className="text-sm text-stone-400">{papers.length} total</span>
        </div>

        {papers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-2xl">
              📝
            </div>
            <p className="font-medium text-stone-700">No papers yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Create your first question paper to get started.
            </p>
            <div className="mt-4 flex justify-center">
              <NewPaperButton />
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((p) => (
              <Link
                key={p.id}
                href={`/editor/${p.id}`}
                className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Mini paper thumbnail */}
                <div className="relative h-28 overflow-hidden border-b border-stone-100 bg-stone-50 p-3">
                  <div className="mx-auto h-full w-3/4 rounded-sm bg-white p-2 shadow-sm">
                    <div className="mx-auto mb-1.5 h-1.5 w-2/3 rounded-full bg-stone-300" />
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded-full bg-stone-200" />
                      <div className="h-1 w-5/6 rounded-full bg-stone-200" />
                      <div className="h-1 w-full rounded-full bg-stone-200" />
                      <div className="h-1 w-2/3 rounded-full bg-stone-200" />
                    </div>
                  </div>
                  <span className="absolute right-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {p.marks} marks
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="truncate font-semibold text-stone-900 group-hover:text-indigo-700">
                    {p.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.className && <Chip>Class {p.className}</Chip>}
                    {p.subject && <Chip>{p.subject}</Chip>}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
                    <span>
                      {p.sections} sections · {p.questions} questions
                    </span>
                    <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
      {children}
    </span>
  );
}
