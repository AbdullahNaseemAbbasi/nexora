"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "needLogin">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      // User not logged in — redirect to login, then come back
      setStatus("needLogin");
      return;
    }

    // Try to accept invitation
    acceptInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    try {
      const res = await apiClient.post(`/tenants/join/${token}`);
      setMessage(res.data.message || "Successfully joined workspace!");
      setStatus("success");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage(error.response?.data?.message || "Failed to join workspace");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 sm:p-10 shadow-2xl w-full max-w-[400px] text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-sm font-bold">N</span>
          </div>
          <span className="text-white text-xl font-semibold">Nexora</span>
        </div>

        {status === "loading" && (
          <div className="py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white/40 mx-auto mb-4" />
            <p className="text-white/60 text-sm">Joining workspace...</p>
          </div>
        )}

        {status === "needLogin" && (
          <div className="py-4">
            <p className="text-white text-lg font-semibold mb-2">Join Workspace</p>
            <p className="text-white/40 text-sm mb-6">
              You need to sign in first before joining this workspace.
            </p>
            <div className="space-y-3">
              <Link href={`/login?redirect=/join/${token}`}>
                <Button className="w-full h-11 bg-white text-black hover:bg-white/90">
                  Sign in to continue
                </Button>
              </Link>
              <Link href={`/register?redirect=/join/${token}`}>
                <button className="w-full h-11 text-sm text-white/50 hover:text-white/80 transition-colors">
                  Don&apos;t have an account? Register
                </button>
              </Link>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="py-4">
            <CheckCircle2 className="h-12 w-12 text-white/70 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold mb-2">You&apos;re in!</p>
            <p className="text-white/40 text-sm mb-6">{message}</p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-11 bg-white text-black hover:bg-white/90"
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="py-4">
            <XCircle className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold mb-2">Oops!</p>
            <p className="text-white/40 text-sm mb-6">{message}</p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-11 border-white/10 text-white hover:bg-white/10">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
