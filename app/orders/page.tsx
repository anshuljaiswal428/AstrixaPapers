"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { rupees } from "@/lib/payments";
import { downloadPaper } from "@/lib/clientExport";
import { OrderChat } from "@/components/OrderChat";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [chat, setChat] = useState<{ id: string; title: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.status === 401) {
      // Not logged in → back to the main page.
      window.location.href = "/";
      return;
    }
    if (res.ok) setOrders(((await res.json()) as { orders: Order[] }).orders);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  async function download(o: Order, format: "PDF" | "DOCX") {
    setBusy(`${o.id}:${format}`);
    try {
      await downloadPaper(o.paperId, format, false);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const approved = orders.filter((o) => o.status === "paid");
  const awaiting = orders.filter((o) => o.status !== "paid");

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              A
            </span>
            <span className="font-semibold text-stone-800">Astrixa Papers</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
          >
            ← Papers
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Hero */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <RequestsIcon />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">My Requests</h1>
            <p className="mt-0.5 text-sm text-indigo-100">
              Your watermark-free requests — download approved ones anytime.
            </p>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && orders.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Approved" value={approved.length} tone="green" />
            <Stat label="Awaiting approval" value={awaiting.length} tone="amber" />
            <Stat label="Total" value={orders.length} tone="stone" />
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border bg-white p-6 text-center">
            <p className="text-stone-600">{error}</p>
            <Link href="/login?callbackUrl=/orders" className="mt-2 inline-block text-indigo-700 underline">
              Sign in
            </Link>
          </div>
        )}

        {loading && !error && (
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border bg-white" />
            ))}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-2xl">
              🧾
            </div>
            <p className="font-medium text-stone-700">No requests yet</p>
            <p className="mt-1 text-sm text-stone-500">
              From a paper, choose “Download → pay to remove watermark”.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700"
            >
              Go to papers
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {orders.map((o) => (
              <OrderRow
                key={o.id}
                o={o}
                busyKey={busy}
                onDownload={(fmt) => download(o, fmt)}
                onChat={() => setChat({ id: o.id, title: o.paper.title })}
              />
            ))}
          </div>
        )}
      </main>

      {chat && (
        <OrderChat orderId={chat.id} title={chat.title} onClose={() => setChat(null)} />
      )}
    </div>
  );
}

function OrderRow({
  o,
  busyKey,
  onDownload,
  onChat,
}: {
  o: Order;
  busyKey: string;
  onDownload: (format: "PDF" | "DOCX") => void;
  onChat: () => void;
}) {
  const approved = o.status === "paid";
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <FormatIcon format={o.format} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-stone-900">{o.paper.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
          <span>No-watermark · PDF &amp; Word</span>
          <span>·</span>
          <span>₹{rupees(o.amount)}</span>
          {approved && o.paidAt && (
            <>
              <span>·</span>
              <span>{new Date(o.paidAt).toLocaleDateString("en-GB")}</span>
            </>
          )}
        </div>
        {!approved && o.utr && (
          <div className="mt-0.5 truncate font-mono text-[11px] text-stone-400">Txn: {o.utr}</div>
        )}
      </div>

      <button
        onClick={onChat}
        title="Chat with admin about this request"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
      >
        <ChatIcon />
        Help
      </button>

      {approved ? (
        <div className="flex shrink-0 gap-2">
          {(["PDF", "DOCX"] as const).map((fmt) => (
            <button
              key={fmt}
              disabled={busyKey === `${o.id}:${fmt}`}
              onClick={() => onDownload(fmt)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              <DownloadIcon />
              {busyKey === `${o.id}:${fmt}` ? "…" : fmt === "PDF" ? "PDF" : "Word"}
            </button>
          ))}
        </div>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Awaiting approval
        </span>
      )}
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
    </svg>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "green" | "amber" | "stone" }) {
  const tones = {
    green: "text-green-700",
    amber: "text-amber-700",
    stone: "text-stone-900",
  };
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className={`text-2xl font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

function FormatIcon({ format }: { format: "PDF" | "DOCX" }) {
  const isPdf = format === "PDF";
  return (
    <div
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[10px] font-bold text-white ${
        isPdf ? "bg-red-500" : "bg-blue-600"
      }`}
    >
      {isPdf ? "PDF" : "DOC"}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
    </svg>
  );
}

function RequestsIcon() {
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
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
