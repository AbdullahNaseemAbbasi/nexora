"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api-client";
import { User, Mail, Lock, Loader2 } from "lucide-react";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Min. 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      const response = await apiClient.post("/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-white/[0.015] rounded-full blur-3xl" />
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

          <h1 className="text-2xl font-bold text-white text-center mb-1">Create account</h1>
          <p className="text-white/40 text-sm text-center mb-8">
            Get started with Nexora for free
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <input
                    placeholder="First name"
                    className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all"
                    {...register("firstName")}
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                </div>
                {errors.firstName && <p className="text-red-400 text-xs mt-1 pl-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <div className="relative">
                  <input
                    placeholder="Last name"
                    className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all"
                    {...register("lastName")}
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                </div>
                {errors.lastName && <p className="text-red-400 text-xs mt-1 pl-1">{errors.lastName.message}</p>}
              </div>
            </div>

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
              {errors.email && <p className="text-red-400 text-xs mt-1 pl-1">{errors.email.message}</p>}
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
              {errors.password && <p className="text-red-400 text-xs mt-1 pl-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all"
                  {...register("confirmPassword")}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 pl-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-white text-black font-medium text-sm rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-white/70 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
