"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import apiClient from "@/lib/api-client";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await apiClient.post("/auth/forgot-password", data).catch(() => null);
    setSubmittedEmail(data.email);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -right-20 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-white/[0.015] rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 sm:p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black text-sm font-bold">N</span>
            </div>
            <span className="text-white text-xl font-semibold">Nexora</span>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white/70" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
              <p className="text-white/40 text-sm mb-1">
                We sent a password reset link to
              </p>
              <p className="text-white/70 text-sm font-medium mb-6">{submittedEmail}</p>
              <p className="text-white/30 text-xs mb-8">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-white/50 hover:text-white transition-colors underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-1">
                Forgot password?
              </h1>
              <p className="text-white/40 text-sm text-center mb-8">
                Enter your email and we&apos;ll send you a reset link
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email address"
                      className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all"
                      {...register("email")}
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-white text-black font-medium text-sm rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="flex justify-center mt-6">
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
