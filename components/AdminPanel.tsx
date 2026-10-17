"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminOrders } from "@/components/AdminOrders";
import { AdminUsers } from "@/components/AdminUsers";
import { AdminTemplateSuggestions } from "@/components/AdminTemplateSuggestions";

type Tab = "requests" | "users" | "templates";

const TABS = ["requests", "users", "templates"] as const;

export function AdminPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Drive the active tab from the URL (?tab=…) so it survives a page refresh.
  const param = searchParams.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(param ?? "") ? (param as Tab) : "requests";

  const select = (key: Tab) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("tab", key);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const tabs = [
    { key: "requests", label: "Payment requests", icon: <CardIcon /> },
    { key: "users", label: "Users", icon: <UsersIcon /> },
    { key: "templates", label: "Template suggestions", icon: <FileIcon /> },
  ] as const;

  return (
    <div>
      <div className="mb-6 inline-flex rounded-xl border border-stone-200 bg-white p-1 text-sm font-medium">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => select(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 transition ${
              tab === key ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        <AdminOrders />
      ) : tab === "users" ? (
        <AdminUsers />
      ) : (
        <AdminTemplateSuggestions />
      )}
    </div>
  );
}

function FileIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
