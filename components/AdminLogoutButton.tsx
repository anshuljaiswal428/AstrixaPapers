"use client";

export function AdminLogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
      }}
      className="rounded-lg border px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
    >
      Sign out
    </button>
  );
}
