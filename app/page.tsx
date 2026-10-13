import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default async function Home() {
  // Already signed in → go straight to the dashboard.
  if (await currentUserId()) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <AnimatedBackground />

      <div className="flex flex-col items-center gap-8">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-700 to-blue-700 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Paper Rankers
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            Design exam papers — MCQs with images, match-the-following, fill-in-the-blanks,
            case studies and more — then export to PDF or Word.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/editor/local"
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-700"
          >
            Try the builder (no sign-in)
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-stone-300 bg-white/70 px-5 py-2.5 text-stone-800 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
          >
            Create an account
          </Link>
        </div>

        <div className="text-sm text-stone-500">
          <Link href="/login" className="hover:underline">
            Already have an account? Sign in →
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-6 text-sm text-stone-500">
        Developed with <span className="text-red-500">♥</span> by{" "}
        <span className="font-semibold text-indigo-700">Astrixa Technologies</span>
      </footer>
    </main>
  );
}
