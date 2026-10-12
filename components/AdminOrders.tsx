"use client";

import { useCallback, useEffect, useState } from "react";
import { rupees } from "@/lib/payments";
import { OrderChat } from "@/components/OrderChat";

type AdminOrder = {
  id: string;
  status: string;
  format: string;
  amount: number;
  utr: string | null;
  screenshotUrl: string | null;
  createdAt: string;
  user: { name: string; phone: string };
  paper: { title: string };
};

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busy, setBusy] = useState("");
  const [chat, setChat] = useState<{ id: string; title: string } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) setOrders(((await res.json()) as { orders: AdminOrder[] }).orders);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
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

  const pending = orders.filter((o) => o.status === "pending" && o.utr);
  const others = orders.filter((o) => !(o.status === "pending" && o.utr));
  const approvedCount = orders.filter((o) => o.status === "paid").length;
  const revenue = orders.filter((o) => o.status === "paid").reduce((n, o) => n + o.amount, 0);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Awaiting approval" value={pending.length} tone="amber" />
        <Stat label="Approved" value={approvedCount} tone="green" />
        <Stat label="Total requests" value={orders.length} tone="stone" />
        <Stat label="Revenue" value={`₹${rupees(revenue)}`} tone="indigo" />
      </div>

      {/* Awaiting approval */}
      <section className="mt-8">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Awaiting approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Empty>Nothing waiting — all caught up. 🎉</Empty>
        ) : (
          <div className="space-y-3">
            {pending.map((o) => (
              <AdminCard
                key={o.id}
                o={o}
                busy={busy === o.id}
                mark={mark}
                onChat={() => setChat({ id: o.id, title: o.paper.title })}
                onViewShot={setLightbox}
                highlight
              />
            ))}
          </div>
        )}
      </section>

      {/* All requests */}
      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
          All requests
        </h2>
        {others.length === 0 ? (
          <Empty>No other requests yet.</Empty>
        ) : (
          <div className="space-y-3">
            {others.map((o) => (
              <AdminCard
                key={o.id}
                o={o}
                busy={busy === o.id}
                mark={mark}
                onChat={() => setChat({ id: o.id, title: o.paper.title })}
                onViewShot={setLightbox}
              />
            ))}
          </div>
        )}
      </section>

      {chat && <OrderChat orderId={chat.id} title={chat.title} onClose={() => setChat(null)} />}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="payment screenshot"
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

function AdminCard({
  o,
  busy,
  mark,
  onChat,
  onViewShot,
  highlight,
}: {
  o: AdminOrder;
  busy: boolean;
  mark: (id: string, paid: boolean) => void;
  onChat: () => void;
  onViewShot: (url: string) => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        highlight ? "border-amber-200 ring-1 ring-amber-100" : "border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FormatBadge format={o.format} />
            <span className="truncate font-semibold text-stone-900">{o.paper.title}</span>
          </div>
          <div className="mt-1 text-sm text-stone-600">
            {o.user.name} <span className="text-stone-400">· {o.user.phone}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
            <span>₹{rupees(o.amount)}</span>
            <span>·</span>
            <span>{new Date(o.createdAt).toLocaleDateString("en-GB")}</span>
          </div>
          {o.utr && (
            <div className="mt-1 inline-block rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] text-stone-700">
              Txn: {o.utr}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={o.status} />
          {o.screenshotUrl && (
            <button onClick={() => onViewShot(o.screenshotUrl!)} title="View payment screenshot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.screenshotUrl}
                alt="payment proof"
                className="h-14 w-14 rounded border object-cover transition hover:ring-2 hover:ring-indigo-400"
              />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {o.status !== "paid" && (
          <button
            disabled={busy}
            onClick={() => mark(o.id, true)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            ✓ Approve
          </button>
        )}
        {o.status === "pending" && (
          <button
            disabled={busy}
            onClick={() => mark(o.id, false)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        )}
        {o.status === "paid" && (
          <button
            disabled={busy}
            onClick={() => mark(o.id, false)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-50"
          >
            Undo
          </button>
        )}
        <button
          onClick={onChat}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
        >
          💬 Chat
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "amber" | "green" | "stone" | "indigo";
}) {
  const tones = {
    amber: "text-amber-700",
    green: "text-green-700",
    stone: "text-stone-900",
    indigo: "text-indigo-700",
  };
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className={`text-2xl font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
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
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-stone-100"}`}
    >
      {label}
    </span>
  );
}

function FormatBadge({ format }: { format: string }) {
  const isPdf = format === "PDF";
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
        isPdf ? "bg-red-500" : "bg-blue-600"
      }`}
    >
      {isPdf ? "PDF" : "DOC"}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
      {children}
    </p>
  );
}
