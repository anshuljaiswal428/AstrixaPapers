"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { migrateGuestPaper } from "@/lib/guestPaper";
import { validatePhone, validatePassword } from "@/lib/authValidation";
import {
  AuthShell,
  AuthField,
  AuthPasswordField,
  AuthButton,
  AuthError,
  PhoneIcon,
} from "@/components/AuthShell";

export function LoginForm() {
  const sp = useSearchParams();
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
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to Paper Rankers to continue"
      footer={
        <>
          No account?{" "}
          <Link href="/register" className="font-semibold text-indigo-700 hover:underline">
            Create one
          </Link>
        </>
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
        <AuthButton busy={busy} busyLabel="Signing in…">
          Sign in
        </AuthButton>
      </form>
    </AuthShell>
  );
}
