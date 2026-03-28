"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    apiClient
      .get(`/auth/verify-email/${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Invalid or expired verification link."
        );
      });
  }, [token]);

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
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 sm:p-10 shadow-2xl text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black text-sm font-bold">N</span>
            </div>
            <span className="text-white text-xl font-semibold">Nexora</span>
          </div>

          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-white/30 mx-auto mb-4" />
              <p className="text-white/50 text-sm">Verifying your email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white/70" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Email verified!</h1>
              <p className="text-white/40 text-sm mb-8">{message}</p>
              <Link
                href="/dashboard"
                className="inline-block w-full h-12 bg-white text-black font-medium text-sm rounded-xl hover:bg-white/90 transition-colors leading-[48px]"
              >
                Go to dashboard
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-400/70" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Verification failed</h1>
              <p className="text-white/40 text-sm mb-8">{message}</p>
              <Link
                href="/dashboard"
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Go to dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
