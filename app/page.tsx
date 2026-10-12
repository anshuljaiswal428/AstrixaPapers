import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";

export default async function Home() {
  // Already signed in → go straight to the dashboard.
  if (await currentUserId()) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          Question Paper Builder
        </h1>
        <p className="mt-3 text-stone-600">
          Design exam papers — MCQs with images, match-the-following, fill-in-the-blanks,
          case studies and more — then export to PDF or Word.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/editor/local"
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-white hover:bg-stone-700"
        >
          Try the builder (no sign-in)
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-stone-300 px-5 py-2.5 text-stone-800 hover:bg-stone-100"
        >
          Create an account
        </Link>
      </div>
      <div className="text-sm text-stone-500">
        <Link href="/login" className="hover:underline">
          Already have an account? Sign in →
        </Link>
      </div>
    </main>
  );
}
