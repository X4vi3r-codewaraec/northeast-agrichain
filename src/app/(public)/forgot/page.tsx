import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = {
  title: "Account recovery — Northeast AgriChain",
  description: "Recover access with a phone re-OTP.",
};

export default function ForgotPage() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-sand-50 px-4 py-12 sm:px-6 lg:px-8">
      <ForgotForm />
    </section>
  );
}
