"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";

/** Full-screen glassmorphic auth layout matching the landing page's theme. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <AnimatedBackground />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl sm:p-10">
          <div className="mb-7 flex flex-col items-center text-center">
            <Link href="/" className="mb-4 inline-flex items-center gap-2" aria-label="Home">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30">
                A
              </span>
            </Link>
            <h1 className="bg-gradient-to-r from-indigo-700 via-violet-700 to-blue-700 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">{footer}</p>
      </div>
    </main>
  );
}

/** Field border/ring classes — red when the field has a validation error. */
function fieldTone(error?: string) {
  return error
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-stone-200 focus:border-indigo-400 focus:ring-indigo-200";
}

/** Labeled text input with a leading icon, themed focus ring, and inline error. */
export function AuthField({
  icon,
  label,
  error,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-stone-600">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          {icon}
        </span>
        <input
          {...props}
          aria-invalid={!!error}
          className={`w-full rounded-xl border bg-white/70 py-2.5 pl-10 pr-3 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2 ${fieldTone(error)}`}
        />
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

/** Password field with a leading lock icon, show/hide toggle, and inline error. */
export function AuthPasswordField({
  label,
  error,
  ...props
}: { label: string; error?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-stone-600">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          <LockIcon />
        </span>
        <input
          {...props}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          className={`w-full rounded-xl border bg-white/70 py-2.5 pl-10 pr-10 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2 ${fieldTone(error)}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

/** Gradient submit button with a busy state. */
export function AuthButton({
  busy,
  children,
  busyLabel,
}: {
  busy: boolean;
  children: React.ReactNode;
  busyLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy && <Spinner />}
      {busy ? busyLabel : children}
    </button>
  );
}

/** Inline error banner. */
export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <WarnIcon />
      <span>{message}</span>
    </div>
  );
}

/* ------------------------------- icons ------------------------------- */

function iconProps(size = 18) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function UserIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...iconProps(17)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps(17)}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1l22 22" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg {...iconProps(16)} className="mt-0.5 shrink-0">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
