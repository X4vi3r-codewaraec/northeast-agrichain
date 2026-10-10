import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="bg-sand-50 px-4 py-16 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md animate-pulse rounded-3xl bg-white p-8 text-ink-500">
            Loading sign-in…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
