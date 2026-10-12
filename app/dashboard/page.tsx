import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewPaperButton } from "@/components/NewPaperButton";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined;
  if (!user?.id) redirect("/login?callbackUrl=/dashboard");

  const papers = await prisma.paper.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, className: true, subject: true, updatedAt: true },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your papers</h1>
          <p className="text-sm text-stone-500">{user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/orders" className="text-sm text-stone-600 hover:underline">
            My requests
          </Link>
          {user.role === "admin" && (
            <Link href="/admin/orders" className="text-sm text-stone-600 hover:underline">
              Approvals
            </Link>
          )}
          <NewPaperButton />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="text-sm text-stone-500 hover:underline">Sign out</button>
          </form>
        </div>
      </div>

      <div className="mt-6 divide-y rounded-lg border bg-white">
        {papers.length === 0 && (
          <p className="p-6 text-center text-stone-400">
            No papers yet. Click “New paper” to start.
          </p>
        )}
        {papers.map((p) => (
          <Link
            key={p.id}
            href={`/editor/${p.id}`}
            className="flex items-center justify-between p-4 hover:bg-stone-50"
          >
            <div>
              <div className="font-medium text-stone-900">{p.title}</div>
              <div className="text-xs text-stone-500">
                {[p.className && `Class ${p.className}`, p.subject].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div className="text-xs text-stone-400">
              {new Date(p.updatedAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
