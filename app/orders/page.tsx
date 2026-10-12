"use client";

import { useCallback, useEffect, useState } from "react";
import { rupees } from "@/lib/payments";
import { downloadPaper } from "@/lib/clientExport";

type Order = {
  id: string;
  paperId: string;
  format: "PDF" | "DOCX";
  amount: number;
  status: string;
  utr: string | null;
  createdAt: string;
  paper: { title: string };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [utrDraft, setUtrDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.status === 401) return setError("Please sign in to see your requests.");
    if (res.ok) setOrders(((await res.json()) as { orders: Order[] }).orders);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000); // reflect approvals without manual refresh
    return () => clearInterval(t);
  }, [load]);

  async function submitUtr(id: string) {
    setBusy(id);
    await fetch(`/api/orders/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utr: utrDraft[id] ?? "" }),
    });
    setBusy("");
    load();
  }

  async function download(o: Order) {
    setBusy(o.id);
    try {
      await downloadPaper(o.paperId, o.format, false);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  if (error) {
    return (
      <main className="p-10">
        <p className="text-stone-600">{error}</p>
        <a href="/login?callbackUrl=/orders" className="text-stone-900 underline">
          Sign in
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My download requests</h1>
        <a href="/dashboard" className="text-sm text-stone-500 hover:underline">
          ← Papers
        </a>
      </div>

      {orders.length === 0 && (
        <p className="rounded-lg border bg-white p-6 text-center text-stone-400">
          No requests yet. From a paper, choose “Download → pay to remove watermark”.
        </p>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{o.paper.title}</div>
                <div className="text-xs text-stone-500">
                  No-watermark {o.format} · ₹{rupees(o.amount)} ·{" "}
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <StatusBadge status={o.status} />
            </div>

            {o.status === "paid" ? (
              <button
                disabled={busy === o.id}
                onClick={() => download(o)}
                className="mt-3 rounded bg-stone-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                {busy === o.id ? "Preparing…" : `Download ${o.format} (no watermark)`}
              </button>
            ) : (
              <div className="mt-3">
                <p className="text-xs text-stone-500">
                  Pay on the UPI QR, then submit your UPI transaction ID (UTR). You’ll be able to
                  download once it’s approved.
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    value={utrDraft[o.id] ?? o.utr ?? ""}
                    onChange={(e) => setUtrDraft((d) => ({ ...d, [o.id]: e.target.value }))}
                    placeholder="UPI transaction ID / UTR"
                    className="flex-1 rounded border px-2 py-1 text-sm"
                  />
                  <button
                    disabled={busy === o.id}
                    onClick={() => submitUtr(o.id)}
                    className="rounded bg-stone-900 px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {o.utr ? "Update" : "Submit"}
                  </button>
                  <a
                    href={`/checkout?paper=${o.paperId}&format=${o.format}`}
                    className="rounded border px-3 py-1 text-sm hover:bg-stone-100"
                  >
                    Show QR
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };
  const label = status === "paid" ? "Approved" : status === "pending" ? "Awaiting approval" : status;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-stone-100"}`}>
      {label}
    </span>
  );
}
