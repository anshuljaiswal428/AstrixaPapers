"use client";

import { useEffect, useState } from "react";
import { rupees } from "@/lib/payments";
import { PaperPreviewModal } from "@/components/PaperPreviewModal";

type UserRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
  papers: number;
  orders: number;
  paidOrders: number;
  totalPaid: number;
};

type PaperInfo = {
  id: string;
  title: string;
  className: string | null;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  sections: number;
  questions: number;
  marks: number;
};

type OrderInfo = {
  id: string;
  format: string;
  amount: number;
  status: string;
  utr: string | null;
  createdAt: string;
  paidAt: string | null;
  paper: { title: string };
};

type UserDetail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  totalPaid: number;
  papers: PaperInfo[];
  orders: OrderInfo[];
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB");

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/users");
      if (res.ok && !cancelled) {
        setUsers(((await res.json()) as { users: UserRow[] }).users);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.email ?? "").toLowerCase().includes(q),
      )
    : users;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Registered users" value={users.length} tone="indigo" />
        <Stat label="Admins" value={users.filter((u) => u.role === "admin").length} tone="amber" />
        <Stat label="Paying users" value={users.filter((u) => u.paidOrders > 0).length} tone="green" />
        <Stat label="Papers made" value={users.reduce((n, u) => n + u.papers, 0)} tone="stone" />
      </div>

      <div className="mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
          {q ? "No users match your search." : "No registered users yet."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:gap-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {initials(u.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-stone-900">{u.name}</span>
                  {u.role === "admin" && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                  <span>{u.phone}</span>
                  {u.email && (
                    <>
                      <span>·</span>
                      <span className="truncate">{u.email}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>joined {fmtDate(u.createdAt)}</span>
                </div>
              </div>
              <div className="hidden shrink-0 gap-4 text-center sm:flex">
                <MiniStat label="papers" value={u.papers} />
                <MiniStat label="paid" value={u.paidOrders} />
                <MiniStat label="spent" value={`₹${rupees(u.totalPaid)}`} />
              </div>
              <span className="shrink-0 text-stone-300">›</span>
            </button>
          ))}
        </div>
      )}

      {selected && <UserDetailModal id={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function UserDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        if (!cancelled) setError(true);
        return;
      }
      const data = (await res.json()) as { user: UserDetail };
      if (!cancelled) setUser(data.user);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!user ? (
          <div className="p-10 text-center text-sm text-stone-500">
            {error ? "Could not load this user." : "Loading…"}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-bold ring-1 ring-white/30">
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-xl font-semibold">{user.name}</h3>
                  {user.role === "admin" && (
                    <span className="rounded bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-indigo-100">
                  {user.phone}
                  {user.email ? ` · ${user.email}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-indigo-200">
                  Joined {fmtDate(user.createdAt)} · ID {user.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 border-b bg-stone-50 p-4">
              <MiniStat label="Papers" value={user.papers.length} />
              <MiniStat label="Requests" value={user.orders.length} />
              <MiniStat label="Total spent" value={`₹${rupees(user.totalPaid)}`} />
            </div>

            <div className="max-h-[60vh] space-y-6 overflow-y-auto p-5">
              {/* Papers */}
              <section>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Saved papers ({user.papers.length})
                </h4>
                {user.papers.length === 0 ? (
                  <Empty>No papers saved.</Empty>
                ) : (
                  <div className="space-y-2">
                    {user.papers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPreviewId(p.id)}
                        className="group block w-full rounded-xl border border-stone-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-medium text-stone-900">
                            {p.title}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 group-hover:bg-indigo-600 group-hover:text-white">
                            <EyeIcon />
                            Preview
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                          {p.className && <span>Class {p.className}</span>}
                          {p.subject && (
                            <>
                              {p.className && <span>·</span>}
                              <span>{p.subject}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{p.sections} sections</span>
                          <span>·</span>
                          <span>{p.questions} questions</span>
                          <span>·</span>
                          <span>{p.marks} marks</span>
                        </div>
                        <div className="mt-1 text-[11px] text-stone-400">
                          Created {fmtDate(p.createdAt)} · Updated {fmtDate(p.updatedAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Orders */}
              <section>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Payment requests ({user.orders.length})
                </h4>
                {user.orders.length === 0 ? (
                  <Empty>No payment requests.</Empty>
                ) : (
                  <div className="space-y-2">
                    {user.orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center gap-3 rounded-xl border border-stone-200 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-stone-900">
                            {o.paper.title}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                            <span>{o.format}</span>
                            <span>·</span>
                            <span>₹{rupees(o.amount)}</span>
                            <span>·</span>
                            <span>{fmtDate(o.createdAt)}</span>
                            {o.utr && (
                              <span className="font-mono text-stone-400">· {o.utr}</span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {previewId && (
          <PaperPreviewModal
            endpoint={`/api/admin/papers/${previewId}`}
            onClose={() => setPreviewId(null)}
          />
        )}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
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

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-lg font-bold text-stone-900">{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-sm text-stone-400">
      {children}
    </p>
  );
}
