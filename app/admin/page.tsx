import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { AdminPanel } from "@/components/AdminPanel";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-600 text-sm font-bold text-white">
              A
            </span>
            <span className="font-semibold text-stone-800">Astrixa Admin</span>
          </div>
          <AdminLogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <ShieldIcon />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">ADMIN</span>
              <h1 className="text-2xl font-semibold">Admin dashboard</h1>
            </div>
            <p className="mt-0.5 text-sm text-amber-100">
              Verify payments, browse registered users, and reply to help chats.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Suspense fallback={<div className="text-sm text-stone-500">Loading…</div>}>
            <AdminPanel />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
