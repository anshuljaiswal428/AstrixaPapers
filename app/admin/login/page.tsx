"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <main className="mx-auto mt-24 max-w-sm rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded bg-amber-600 px-1.5 py-0.5 text-xs font-bold text-white">ADMIN</span>
        <h1 className="text-xl font-semibold">Admin sign in</h1>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          autoFocus
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-stone-900 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter admin dashboard"}
        </button>
      </form>
    </main>
  );
}
