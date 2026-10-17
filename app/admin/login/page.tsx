"use client";

import { useState } from "react";
import { validatePhone, validatePassword } from "@/lib/authValidation";
import {
  AuthShell,
  AuthField,
  AuthPasswordField,
  AuthButton,
  AuthError,
  PhoneIcon,
} from "@/components/AuthShell";

export default function AdminLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe = {
      phone: validatePhone(phone) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(fe);
    if (fe.phone || fe.password) return;

    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (res.ok) {
      window.location.href = "/admin";
      return;
    }
    setBusy(false);
    setError("Invalid admin credentials, or this account isn’t an admin.");
  }

  return (
    <AuthShell
      title="Admin sign in"
      subtitle="Use your admin account (phone + password)"
      footer={
        <span className="inline-flex items-center gap-1.5 text-xs text-stone-400">
          <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            ADMIN
          </span>
          Restricted access
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          icon={<PhoneIcon />}
          label="Phone number"
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          value={phone}
          error={fieldErrors.phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setFieldErrors((p) => ({ ...p, phone: undefined }));
          }}
          autoFocus
        />
        <AuthPasswordField
          label="Password"
          placeholder="Your password"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((p) => ({ ...p, password: undefined }));
          }}
        />
        <AuthError message={error} />
        <AuthButton busy={busy} busyLabel="Checking…">
          Enter admin dashboard
        </AuthButton>
      </form>
    </AuthShell>
  );
}
