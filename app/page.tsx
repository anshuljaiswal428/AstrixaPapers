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
        Product by <span className="font-semibold text-indigo-700">Astrixa Technologies</span>{" "}
        <svg
          viewBox="0 0 24 24"
          fill="#ef4444"
          className="inline-block h-5 w-5 align-middle"
          aria-label="love"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </footer>
    </main>
  );
}
