import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  if (await currentUserId()) redirect("/dashboard");
  return (
    <Suspense fallback={<div className="p-10 text-stone-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
