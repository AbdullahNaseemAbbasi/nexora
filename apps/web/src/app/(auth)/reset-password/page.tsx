"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import apiClient from "@/lib/api-client";
import { Lock, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password: data.password,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApiError(e.response?.data?.message || "Invalid or expired link. Please request a new one.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-10 text-center max-w-sm w-full">
          <p className="text-white/50 text-sm mb-4">Invalid reset link.</p>
          <Link href="/forgot-password" className="text-white/70 hover:text-white text-sm transition-colors">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

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

          {done ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white/70" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Password updated!</h1>
              <p className="text-white/40 text-sm mb-6">
                Your password has been changed. Redirecting to login...
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-1">
                Set new password
              </h1>
              <p className="text-white/40 text-sm text-center mb-8">
                Choose a strong password for your account
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {apiError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg text-center">
                    {apiError}
                  </div>
                )}

                <div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all"
                      {...register("password")}
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all"
                      {...register("confirmPassword")}
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1.5 pl-1">
                      {errors.confirmPassword.message}
                    </p>
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
                      Updating...
                    </>
                  ) : (
                    "Update password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
