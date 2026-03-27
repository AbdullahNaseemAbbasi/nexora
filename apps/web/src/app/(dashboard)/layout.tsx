"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Bell,
  Search,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/ai", label: "AI Assistant", icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, setAuth, logout } = useAuthStore();
  const { tenants, currentTenant, setTenants, setCurrentTenant } = useTenantStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgDropdown, setOrgDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const init = async () => {
      try {
        // Fetch user if not in store
        let userData = user;
        if (!userData) {
          const res = await apiClient.get("/auth/me");
          const refreshToken = localStorage.getItem("refreshToken") || "";
          setAuth(res.data, token, refreshToken);
          userData = res.data;
        }
        // Fetch tenants
        const tenantsRes = await apiClient.get("/tenants");
        setTenants(tenantsRes.data);
        setLoading(false);
      } catch {
        logout();
        router.push("/login");
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed h-full z-50 w-[240px] border-r border-border bg-background flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Workspace Switcher */}
        <div className="px-3 pt-4 pb-2 relative">
          <button
            onClick={() => setOrgDropdown(!orgDropdown)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <div className="h-6 w-6 bg-foreground rounded flex items-center justify-center shrink-0">
              <span className="text-background text-xs font-semibold">
                {currentTenant?.name?.[0] || "N"}
              </span>
            </div>
            <span className="text-sm font-semibold truncate">{currentTenant?.name || "Select workspace"}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 transition-transform ${orgDropdown ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {orgDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOrgDropdown(false)} />
              <div className="absolute left-3 right-3 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                <p className="px-3 py-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                  Workspaces
                </p>
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => {
                      setCurrentTenant(tenant);
                      setOrgDropdown(false);
                      window.location.href = "/dashboard";
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-accent transition-colors ${
                      currentTenant?.id === tenant.id ? "bg-accent font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <div className="h-5 w-5 bg-foreground/10 rounded flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium">{tenant.name[0]}</span>
                    </div>
                    {tenant.name}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setOrgDropdown(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create workspace
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-1 space-y-0.5">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-3 border-t border-border pt-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="h-6 w-6 bg-accent rounded-full flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{user?.firstName} {user?.lastName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 lg:ml-[240px]">
        {/* Topbar */}
        <header className="h-12 border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/80 backdrop-blur-sm z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 w-48 lg:w-64"
              />
            </div>
          </div>

          {/* Right side — Theme toggle + Bell */}
          <div className="flex items-center gap-1">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}
            <button className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-primary rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
