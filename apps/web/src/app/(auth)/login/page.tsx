"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api-client";
import { Mail, Lock, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const response = await apiClient.post("/auth/login", data);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      const redirect = searchParams.get("redirect");
      router.push(redirect || "/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -right-20 w-72 h-72 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-white/[0.015] rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Glass Card */}
      <div className="relative w-full max-w-[420px]">
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 sm:p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black text-sm font-bold">N</span>
            </div>
            <span className="text-white text-xl font-semibold">Nexora</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-1">Welcome back</h1>
          <p className="text-white/40 text-sm text-center mb-8">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all"
                  {...register("password")}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-white" />
                <span className="text-xs text-white/40">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-white text-black font-medium text-sm rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-white/30 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-white/70 hover:text-white transition-colors font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
