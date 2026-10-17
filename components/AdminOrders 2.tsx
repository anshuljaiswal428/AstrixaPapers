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
  user: { name: string; phone: string };
  paper: { title: string };
};

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) setOrders(((await res.json()) as { orders: AdminOrder[] }).orders);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // reflect new submissions
    return () => clearInterval(t);
  }, [load]);

  async function mark(id: string, paid: boolean) {
    setBusy(id);
    await fetch(`/api/admin/orders/${id}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid }),
    });
    setBusy("");
    load();
  }

  // Requests awaiting approval (transaction ID submitted) come first.
  const pending = orders.filter((o) => o.status === "pending" && o.utr);
  const others = orders.filter((o) => !(o.status === "pending" && o.utr));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-amber-700">
          Awaiting approval ({pending.length})
        </h2>
        <OrderTable orders={pending} busy={busy} mark={mark} highlight />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-stone-500">All requests</h2>
        <OrderTable orders={others} busy={busy} mark={mark} />
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };
  const label = status === "paid" ? "Approved" : status === "pending" ? "Pending" : "Rejected";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-stone-100"}`}>
      {label}
    </span>
  );
}

function OrderTable({
  orders,
  busy,
  mark,
  highlight,
}: {
  orders: AdminOrder[];
  busy: string;
  mark: (id: string, paid: boolean) => void;
  highlight?: boolean;
}) {
  if (orders.length === 0)
    return <p className="rounded-lg border bg-white p-4 text-sm text-stone-400">Nothing here.</p>;

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-stone-500">
          <tr>
            <th className="p-3">Paper</th>
            <th className="p-3">User</th>
            <th className="p-3">Format</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Transaction ID</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={`border-t ${highlight ? "bg-amber-50/40" : ""}`}>
              <td className="p-3">{o.paper.title}</td>
              <td className="p-3">
                {o.user.name}
                <span className="block text-xs text-stone-400">{o.user.phone}</span>
              </td>
              <td className="p-3">{o.format}</td>
              <td className="p-3">₹{rupees(o.amount)}</td>
              <td className="p-3 font-mono text-xs">{o.utr ?? "—"}</td>
              <td className="p-3">
                <StatusBadge status={o.status} />
              </td>
              <td className="p-3">
                <div className="flex gap-1">
                  {o.status !== "paid" && (
                    <button
                      disabled={busy === o.id}
                      onClick={() => mark(o.id, true)}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {o.status !== "failed" && o.status !== "paid" && (
                    <button
                      disabled={busy === o.id}
                      onClick={() => mark(o.id, false)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  {o.status === "paid" && (
                    <button
                      disabled={busy === o.id}
                      onClick={() => mark(o.id, false)}
                      className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
