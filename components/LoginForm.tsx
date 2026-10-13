"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { migrateGuestPaper } from "@/lib/guestPaper";

export function LoginForm() {
  const sp = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", { phone, password, redirect: false });
    if (res?.error) {
      setBusy(false);
      setError("Invalid phone number or password.");
      return;
    }
    // Preserve any work the guest built before signing in.
    const migratedId = await migrateGuestPaper();
    window.location.href = migratedId
      ? `/editor/${migratedId}`
      : (sp.get("callbackUrl") ?? "/dashboard");
  }

  return (
    <main className="flex justify-center px-4 pt-14 sm:pt-20">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-stone-900 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-500">
        No account?{" "}
        <a href="/register" className="text-stone-900 hover:underline">
          Create one
        </a>
      </p>
      </div>
    </main>
  );
}
