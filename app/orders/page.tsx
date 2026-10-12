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
    // Poll so an approval flips "awaiting" → downloadable without a manual refresh.
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
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
        Your watermark-free download requests — approved ones can be downloaded; submitted ones
        are waiting for admin approval.
      </p>

      {orders.length === 0 && (
        <p className="rounded-lg border bg-white p-6 text-center text-stone-400">
          Nothing here yet. From a paper, choose “Download → pay to remove watermark”.
        </p>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const approved = o.status === "paid";
          return (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border bg-white p-4"
            >
              <div>
                <div className="font-medium">{o.paper.title}</div>
                <div className="mt-0.5 text-xs text-stone-500">
                  No-watermark {o.format} · ₹{rupees(o.amount)}
                  {approved && o.paidAt ? ` · ${new Date(o.paidAt).toLocaleDateString()}` : ""}
                </div>
                {!approved && o.utr && (
                  <div className="mt-0.5 text-xs text-stone-400">Txn ID: {o.utr}</div>
                )}
              </div>

              {approved ? (
                <button
                  disabled={busy === o.id}
                  onClick={() => download(o)}
                  className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {busy === o.id ? "Preparing…" : `Download ${o.format}`}
                </button>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  Awaiting approval
                </span>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
