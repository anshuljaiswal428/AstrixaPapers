import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewPaperButton } from "@/components/NewPaperButton";
import { PaperCard } from "@/components/PaperCard";
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
      // Format on the server with a fixed locale so client hydration matches.
      updatedAt: new Date(p.updatedAt).toLocaleDateString("en-GB"),
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
              <PaperCard key={p.id} paper={p} />
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
