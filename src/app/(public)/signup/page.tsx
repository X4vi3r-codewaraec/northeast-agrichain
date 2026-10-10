import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-sand-50 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-xl animate-pulse rounded-3xl bg-white p-8 text-ink-500">
            Loading sign-up…
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}