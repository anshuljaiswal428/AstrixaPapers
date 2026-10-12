import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
  if (await currentUserId()) redirect("/dashboard");
  return <RegisterForm />;
}
