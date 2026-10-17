import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { TEMPLATES } from "@/lib/templates";
import { NewPaperTemplates } from "@/components/NewPaperTemplates";

export default async function NewPaperPage() {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              A
            </span>
            <span className="font-semibold text-stone-800">Astrixa Papers</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">Choose a template</h1>
          <p className="mt-1 text-sm text-stone-500">
            Pick a layout to start your question paper. More templates are on the way — can’t find
            what you need? Suggest one by uploading a sample.
          </p>
        </div>

        <NewPaperTemplates templates={TEMPLATES} />
      </main>
    </div>
  );
}
