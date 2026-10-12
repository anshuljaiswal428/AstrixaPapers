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
  paidAt: string | null;
  paper: { title: string };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.status === 401) return setError("Please sign in to see your downloads.");
    if (res.ok) setOrders(((await res.json()) as { orders: Order[] }).orders);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My downloads</h1>
        <a href="/dashboard" className="text-sm text-stone-500 hover:underline">
          ← Papers
        </a>
      </div>
      <p className="mb-5 text-sm text-stone-500">
        Your paid, watermark-free downloads. Re-download any of them anytime.
      </p>

      {orders.length === 0 && (
        <p className="rounded-lg border bg-white p-6 text-center text-stone-400">
          No paid downloads yet. From a paper, choose “Download → pay to remove watermark”.
        </p>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
              <div className="font-medium">{o.paper.title}</div>
              <div className="text-xs text-stone-500">
                No-watermark {o.format} · ₹{rupees(o.amount)}
                {o.paidAt ? ` · ${new Date(o.paidAt).toLocaleDateString()}` : ""}
              </div>
            </div>
            <button
              disabled={busy === o.id}
              onClick={() => download(o)}
              className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {busy === o.id ? "Preparing…" : `Download ${o.format}`}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
