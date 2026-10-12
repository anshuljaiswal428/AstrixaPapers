"use client";

import { useCallback, useEffect, useState } from "react";
import { rupees } from "@/lib/payments";

type AdminOrder = {
  id: string;
  status: string;
  format: string;
  amount: number;
  utr: string | null;
  createdAt: string;
  user: { email: string };
  paper: { title: string };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.status === 403) return setError("Admin access required.");
    if (res.ok) setOrders(((await res.json()) as { orders: AdminOrder[] }).orders);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function mark(id: string, paid: boolean) {
    await fetch(`/api/admin/orders/${id}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid }),
    });
    load();
  }

  if (error) return <main className="p-10 text-red-600">{error}</main>;

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-semibold">Orders</h1>
      <table className="w-full border text-sm">
        <thead className="bg-stone-100 text-left">
          <tr>
            <th className="p-2">Paper</th>
            <th className="p-2">User</th>
            <th className="p-2">Format</th>
            <th className="p-2">Amount</th>
            <th className="p-2">UTR</th>
            <th className="p-2">Status</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-2">{o.paper.title}</td>
              <td className="p-2">{o.user.email}</td>
              <td className="p-2">{o.format}</td>
              <td className="p-2">₹{rupees(o.amount)}</td>
              <td className="p-2 font-mono text-xs">{o.utr ?? "—"}</td>
              <td className="p-2">
                <span
                  className={
                    o.status === "paid"
                      ? "text-green-700"
                      : o.status === "failed"
                        ? "text-red-600"
                        : "text-amber-700"
                  }
                >
                  {o.status}
                </span>
              </td>
              <td className="p-2">
                {o.status !== "paid" ? (
                  <button
                    onClick={() => mark(o.id, true)}
                    className="rounded bg-green-600 px-2 py-0.5 text-xs text-white"
                  >
                    Mark paid
                  </button>
                ) : (
                  <button
                    onClick={() => mark(o.id, false)}
                    className="rounded border px-2 py-0.5 text-xs"
                  >
                    Undo
                  </button>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-stone-400">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
