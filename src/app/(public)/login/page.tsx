import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="bg-sand-50 px-4 py-16 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}