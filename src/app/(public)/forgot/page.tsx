import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = {
  title: "Account recovery — Northeast AgriChain",
  description: "Recover access with a phone re-OTP.",
};

export default function ForgotPage() {
  return (
    <section className="bg-sand-50 py-16 sm:py-24">
      <div className="px-4 sm:px-6 lg:px-8">
        <ForgotForm />
      </div>
    </section>
  );
}
