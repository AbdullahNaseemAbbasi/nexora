"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch user data if not in store
    if (!user) {
      apiClient
        .get("/auth/me")
        .then((res) => {
          const refreshToken = localStorage.getItem("refreshToken") || "";
          setAuth(res.data, token, refreshToken);
          setLoading(false);
        })
        .catch(() => {
          logout();
          router.push("/login");
        });
    } else {
      setLoading(false);
    }
  }, [user, router, setAuth, logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Nexora</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-sm">
            Dashboard
          </Link>
          <Link href="/dashboard/projects" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-sm">
            Projects
          </Link>
          <Link href="/dashboard/team" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-sm">
            Team
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-sm">
            Settings
          </Link>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
          <div className="text-xs text-gray-400">{user?.email}</div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
