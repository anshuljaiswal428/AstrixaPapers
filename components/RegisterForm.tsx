"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { migrateGuestPaper } from "@/lib/guestPaper";
import { validateName, validatePhone, validatePassword } from "@/lib/authValidation";
import {
  AuthShell,
  AuthField,
  AuthPasswordField,
  AuthButton,
  AuthError,
  UserIcon,
  PhoneIcon,
} from "@/components/AuthShell";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    password?: string;
  }>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe = {
      name: validateName(name) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(fe);
    if (fe.name || fe.phone || fe.password) return;

    setBusy(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not register.");
      setBusy(false);
      return;
    }
    await signIn("credentials", { phone, password, redirect: false });
    // Keep the paper the guest built before signing up.
    const migratedId = await migrateGuestPaper();
    window.location.href = migratedId ? `/editor/${migratedId}` : "/dashboard";
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building exam papers in minutes"
      footer={
        <>
          Have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          icon={<UserIcon />}
          label="Full name"
          placeholder="Your name"
          value={name}
          error={fieldErrors.name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldErrors((p) => ({ ...p, name: undefined }));
          }}
        />
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
        />
        <AuthPasswordField
          label="Password"
          placeholder="Min 6 characters"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((p) => ({ ...p, password: undefined }));
          }}
        />
        <AuthError message={error} />
        <AuthButton busy={busy} busyLabel="Creating…">
          Create account
        </AuthButton>
      </form>
    </AuthShell>
  );
}
