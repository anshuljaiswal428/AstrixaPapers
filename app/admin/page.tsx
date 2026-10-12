import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { AdminOrders } from "@/components/AdminOrders";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-600 px-1.5 py-0.5 text-xs font-bold text-white">
            ADMIN
          </span>
          <h1 className="text-2xl font-semibold">Payment requests</h1>
        </div>
        <AdminLogoutButton />
      </div>
      <AdminOrders />
    </main>
  );
}
