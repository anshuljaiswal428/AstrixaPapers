"use client";

import { useCallback, useEffect, useState } from "react";
import { rupees } from "@/lib/payments";
import { OrderChat } from "@/components/OrderChat";
import { hasUnread, markSeen, type LastMessage } from "@/lib/chatSeen";

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
  lastMessage: LastMessage;
};

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busy, setBusy] = useState("");
  const [chat, setChat] = useState<{ id: string; title: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ id: string; url: string } | null>(null);
  const [qPending, setQPending] = useState("");
  const [qAll, setQAll] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "failed">("all");
  // Bumped when a chat is opened/closed so unread dots recompute immediately.
  const [, setSeenTick] = useState(0);

  function openChat(o: AdminOrder) {
    markSeen(o.id, o.lastMessage?.createdAt);
    setSeenTick((n) => n + 1);
    setChat({ id: o.id, title: o.paper.title });
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) setOrders(((await res.json()) as { orders: AdminOrder[] }).orders);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id: string, status: "paid" | "failed" | "pending") {
    setBusy(id);
    await fetch(`/api/admin/orders/${id}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy("");
    load();
  }

  async function deleteScreenshot(id: string) {
    if (!confirm("Delete this payment screenshot? This cannot be undone.")) return;
    await fetch(`/api/admin/orders/${id}/screenshot`, { method: "DELETE" });
    setLightbox(null);
    load();
  }

  function downloadScreenshot(id: string, url: string) {
    const ext = /^data:image\/(\w+)/.exec(url)?.[1] ?? "png";
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-${id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const matches = (o: AdminOrder, q: string) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      o.user.phone.includes(s) ||
      o.user.name.toLowerCase().includes(s) ||
      (o.utr ?? "").toLowerCase().includes(s) ||
      o.paper.title.toLowerCase().includes(s)
    );
  };

  const pendingAll = orders.filter((o) => o.status === "pending" && o.utr);
  const pending = pendingAll.filter((o) => matches(o, qPending));

  const approvedCount = orders.filter((o) => o.status === "paid").length;
  const rejectedCount = orders.filter((o) => o.status === "failed").length;
  const revenue = orders.filter((o) => o.status === "paid").reduce((n, o) => n + o.amount, 0);

  const byStatus = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const allList = byStatus.filter((o) => matches(o, qAll));

  const FILTERS = [
    { key: "all", label: "All", count: orders.length },
    { key: "pending", label: "Awaiting", count: orders.filter((o) => o.status === "pending").length },
    { key: "paid", label: "Approved", count: approvedCount },
    { key: "failed", label: "Rejected", count: rejectedCount },
  ] as const;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Awaiting approval" value={pendingAll.length} tone="amber" />
        <Stat label="Approved" value={approvedCount} tone="green" />
        <Stat label="Total requests" value={orders.length} tone="stone" />
        <Stat label="Revenue" value={`₹${rupees(revenue)}`} tone="indigo" />
      </div>

      {/* Awaiting approval — amber, action-needed panel */}
      <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Awaiting approval ({pendingAll.length})
          </h2>
          <SearchInput
            value={qPending}
            onChange={setQPending}
            placeholder="Search awaiting by number…"
            tone="amber"
          />
        </div>
        <div className="mt-3">
          {pendingAll.length === 0 ? (
            <Empty>Nothing waiting — all caught up. 🎉</Empty>
          ) : pending.length === 0 ? (
            <Empty>No awaiting requests match “{qPending}”.</Empty>
          ) : (
            <div className="space-y-3">
              {pending.map((o) => (
                <AdminCard
                  key={o.id}
                  o={o}
                  busy={busy === o.id}
                  unread={hasUnread(o.id, o.lastMessage, "admin")}
                  setStatus={setStatus}
                  onChat={() => openChat(o)}
                  onViewShot={(id, url) => setLightbox({ id, url })}
                  highlight
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All requests — neutral panel with status filter + search */}
      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            All requests ({allList.length})
          </h2>
          <SearchInput
            value={qAll}
            onChange={setQAll}
            placeholder="Search by number, name, txn…"
            tone="stone"
          />
        </div>

        {/* Status filter chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === f.key
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="mt-4">
          {allList.length === 0 ? (
            <Empty>{qAll ? `No requests match “${qAll}”.` : "No requests in this view."}</Empty>
          ) : (
            <div className="space-y-3">
              {allList.map((o) => (
                <AdminCard
                  key={o.id}
                  o={o}
                  busy={busy === o.id}
                  unread={hasUnread(o.id, o.lastMessage, "admin")}
                  setStatus={setStatus}
                  onChat={() => openChat(o)}
                  onViewShot={(id, url) => setLightbox({ id, url })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {chat && (
        <OrderChat
          orderId={chat.id}
          title={chat.title}
          onClose={() => {
            setChat(null);
            setSeenTick((n) => n + 1);
          }}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt="payment screenshot"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] max-w-full rounded-lg shadow-2xl"
          />
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => downloadScreenshot(lightbox.id, lightbox.url)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              <DownloadIcon /> Download
            </button>
            <button
              onClick={() => deleteScreenshot(lightbox.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <TrashIcon /> Delete
            </button>
            <button
              onClick={() => setLightbox(null)}
              className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AdminCard({
  o,
  busy,
  unread,
  setStatus,
  onChat,
  onViewShot,
  highlight,
}: {
  o: AdminOrder;
  busy: boolean;
  unread: boolean;
  setStatus: (id: string, status: "paid" | "failed" | "pending") => void;
  onChat: () => void;
  onViewShot: (id: string, url: string) => void;
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
          {o.screenshotUrl ? (
            <button
              onClick={() => onViewShot(o.id, o.screenshotUrl!)}
              title="View payment screenshot"
              className="group relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.screenshotUrl}
                alt="payment proof"
                className="h-14 w-14 rounded border object-cover transition group-hover:ring-2 group-hover:ring-indigo-400"
              />
              <span className="absolute inset-0 grid place-items-center rounded bg-black/0 text-[10px] font-medium text-transparent transition group-hover:bg-black/40 group-hover:text-white">
                View
              </span>
            </button>
          ) : (
            <span className="text-[11px] text-stone-400">no screenshot</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {o.status === "pending" && (
          <>
            <button
              disabled={busy}
              onClick={() => setStatus(o.id, "paid")}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              disabled={busy}
              onClick={() => setStatus(o.id, "failed")}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {o.status === "paid" && (
          <button
            disabled={busy}
            onClick={() => setStatus(o.id, "pending")}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-50"
          >
            Undo approval
          </button>
        )}
        {o.status === "failed" && (
          <button
            disabled={busy}
            onClick={() => setStatus(o.id, "pending")}
            className="rounded-lg border px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          >
            Re-open
          </button>
        )}
        <button
          onClick={onChat}
          className="relative ml-auto inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <ChatIcon />
          Chat
          {unread && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  tone,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  tone: "amber" | "stone";
}) {
  const ring = tone === "amber" ? "focus:border-amber-400" : "focus:border-stone-400";
  return (
    <div className="relative w-full sm:w-64">
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="search"
        className={`w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-7 text-sm outline-none ${ring}`}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-stone-400 hover:bg-stone-100"
          title="Clear"
        >
          ✕
        </button>
      )}
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
