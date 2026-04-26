"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, FolderKanban, Users, Settings, LogOut, Sparkles,
  Bell, Search, ChevronDown, Moon, Sun, Menu, Plus, Check, CheckCheck,
  BarChart2, ListTodo, Activity, Building2, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";
import { getSocket } from "@/lib/socket";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/my-tasks", label: "My Tasks", icon: ListTodo },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/ai", label: "AI Assistant", icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  _count?: { members: number; projects: number };
}

function CreateWorkspaceScreen({ onCreated }: { onCreated: (tenant: Tenant) => void }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const res = await apiClient.post("/tenants", { name: name.trim(), slug });
      onCreated(res.data);
    } catch {
      setError("Failed to create workspace. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-background text-sm font-bold">N</span>
          </div>
          <span className="text-xl font-semibold">Nexora</span>
        </div>
        <div className="border border-border rounded-xl p-8 space-y-6">
          <div className="text-center">
            <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Create your workspace</h1>
            <p className="text-sm text-muted-foreground mt-1">Give your team a home on Nexora</p>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Inc, My Startup..."
              className="w-full h-11 bg-accent border border-border rounded-lg px-4 text-sm outline-none focus:border-foreground/30 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full h-11 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create workspace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, setAuth, logout, hydrate: hydrateAuth } = useAuthStore();
  const {
    tenants, currentTenant, setTenants, setCurrentTenant,
    setOverview, setMyTasks, setProjects, setMembers, setInvitations, setActivity, setDetailedStats,
    hydrate: hydrateTenants,
  } = useTenantStore();
  const [loading, setLoading] = useState(true);
  const [noTenant, setNoTenant] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgDropdown, setOrgDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ projects: any[]; tasks: any[] }>({ projects: [], tasks: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [taskCounts, setTaskCounts] = useState({ total: 0, inProgress: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => setMounted(true), []);

  const fetchNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient.get("/notifications"),
        apiClient.get("/notifications/count"),
      ]);
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    hydrateAuth();
    hydrateTenants();

    // Always fetch fresh data — deterministic, no race conditions.
    // Stale localStorage tenant IDs are reconciled by setTenants which validates
    // savedId against the fresh list and falls back to tenants[0] if invalid.
    const init = async () => {
      try {
        const [userRes, tenantsRes] = await Promise.all([
          apiClient.get("/auth/me"),
          apiClient.get("/tenants"),
        ]);
        const refreshToken = localStorage.getItem("refreshToken") || "";
        setAuth(userRes.data, token, refreshToken);

        const tenantList = tenantsRes.data || [];
        setTenants(tenantList);
        if (tenantList.length === 0) setNoTenant(true);
      } catch {
        logout();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // PREFETCH ALL PAGE DATA sequentially when tenant changes. Sequential avoids
  // Chrome's per-host concurrent-connection limit on localhost which was causing
  // some requests to hang. Total prefetch ~2s on Sydney Supabase but every page
  // navigation after that is instant from the store cache.
  useEffect(() => {
    if (!currentTenant) return;
    const tenantId = currentTenant.id;
    let cancelled = false;

    const run = async () => {
      try {
        const overview = await apiClient.get("/analytics/overview");
        if (cancelled) return;
        setOverview(overview.data);
        setTaskCounts({ total: overview.data.totalTasks || 0, inProgress: overview.data.inProgressTasks || 0 });
      } catch {
        if (!cancelled) { setOverview(null); setTaskCounts({ total: 0, inProgress: 0 }); }
      }

      try {
        const myTasks = await apiClient.get("/tasks/my");
        if (cancelled) return;
        setMyTasks(myTasks.data || []);
      } catch { if (!cancelled) setMyTasks([]); }

      try {
        const projects = await apiClient.get("/projects");
        if (cancelled) return;
        setProjects(projects.data || []);
      } catch { if (!cancelled) setProjects([]); }

      try {
        const members = await apiClient.get(`/tenants/${tenantId}/members`);
        if (cancelled) return;
        setMembers(members.data || []);
      } catch { if (!cancelled) setMembers([]); }

      try {
        const invitations = await apiClient.get(`/tenants/${tenantId}/invitations`);
        if (cancelled) return;
        setInvitations(invitations.data || []);
      } catch { if (!cancelled) setInvitations([]); }

      try {
        const activity = await apiClient.get("/analytics/activity?limit=50");
        if (cancelled) return;
        setActivity(activity.data || []);
      } catch { if (!cancelled) setActivity([]); }

      try {
        const detailed = await apiClient.get("/analytics/detailed");
        if (cancelled) return;
        setDetailedStats(detailed.data);
      } catch { if (!cancelled) setDetailedStats(null); }
    };

    run();
    return () => { cancelled = true; };
  }, [currentTenant, setOverview, setMyTasks, setProjects, setMembers, setInvitations, setActivity, setDetailedStats]);

  useEffect(() => {
    if (!currentTenant || !user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    try {
      const socket = getSocket();
      socket.emit("join-tenant", currentTenant.id);
      socket.emit("join-user", user.id);
      socket.on("notification:new", (notif: Notification) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      });
      return () => {
        clearInterval(interval);
        socket.off("notification:new");
      };
    } catch {
      return () => clearInterval(interval);
    }
  }, [currentTenant, user, fetchNotifications]);

  const handleWorkspaceCreated = (tenant: Tenant) => {
    setTenants([tenant]);
    setCurrentTenant(tenant);
    setNoTenant(false);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults({ projects: [], tasks: [] }); setSearchOpen(false); return; }
    try {
      const res = await apiClient.get(`/analytics/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
      setSearchOpen(true);
    } catch {}
  };

  const handleLogout = () => { logout(); router.push("/login"); };

  const typeLabel: Record<string, string> = {
    TASK_ASSIGNED: "Task assigned", TASK_COMPLETED: "Task completed",
    TASK_COMMENT: "New comment", INVITATION: "Invitation",
    PROJECT_UPDATE: "Project update", AI_SUGGESTION: "AI suggestion", BILLING: "Billing",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (noTenant) {
    return <CreateWorkspaceScreen onCreated={handleWorkspaceCreated} />;
  }

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed h-full z-50 w-[240px] border-r border-border bg-background flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-3 pt-4 pb-2 relative">
          <button
            onClick={() => setOrgDropdown(!orgDropdown)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <div className="h-6 w-6 bg-foreground rounded flex items-center justify-center shrink-0">
              <span className="text-background text-xs font-semibold">{currentTenant?.name?.[0] || "N"}</span>
            </div>
            <span className="text-sm font-semibold truncate">{currentTenant?.name || "Select workspace"}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 transition-transform ${orgDropdown ? "rotate-180" : ""}`} />
          </button>

          {orgDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOrgDropdown(false)} />
              <div className="absolute left-3 right-3 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                <p className="px-3 py-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Workspaces</p>
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => { setCurrentTenant(tenant); setOrgDropdown(false); window.location.href = "/dashboard"; }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-accent transition-colors ${currentTenant?.id === tenant.id ? "bg-accent font-medium" : "text-muted-foreground"}`}
                  >
                    <div className="h-5 w-5 bg-foreground/10 rounded flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium">{tenant.name[0]}</span>
                    </div>
                    {tenant.name}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <Link href="/dashboard/settings" onClick={() => setOrgDropdown(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                    Create workspace
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 px-3 pt-1 space-y-0.5">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors ${isActive ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                <link.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{link.label}</span>
                {link.label === "Projects" && taskCounts.inProgress > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">{taskCounts.inProgress}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3 border-t border-border pt-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="h-6 w-6 bg-accent rounded-full flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{user?.firstName} {user?.lastName}</p>
            </div>
            <button onClick={handleLogout} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" title="Logout">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[240px]">
        <header className="h-12 border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/80 backdrop-blur-sm z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1 text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground relative">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 w-48 lg:w-64"
              />
              {searchOpen && (searchResults.projects.length > 0 || searchResults.tasks.length > 0) && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                  <div className="absolute left-0 top-full mt-3 w-80 bg-background border border-border rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
                    {searchResults.projects.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Projects</p>
                        {searchResults.projects.map((p: any) => (
                          <Link key={p.id} href={`/dashboard/projects/${p.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                            className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent transition-colors">
                            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                            {p.name}
                          </Link>
                        ))}
                      </>
                    )}
                    {searchResults.tasks.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Tasks</p>
                        {searchResults.tasks.map((t: any) => (
                          <Link key={t.id} href={`/dashboard/projects/${t.projectId}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                            className="flex items-center justify-between px-3 py-2 text-[13px] hover:bg-accent transition-colors">
                            <span>{t.title}</span>
                            <span className="text-[10px] text-muted-foreground">{t.project?.name}</span>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-foreground text-background text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="text-[13px] font-semibold">Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                          <CheckCheck className="h-3 w-3" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-[13px] text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif, index) => (
                          <div key={notif.id}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${index !== notifications.length - 1 ? "border-b border-border" : ""} ${!notif.read ? "bg-accent/30" : ""}`}
                            onClick={() => !notif.read && handleMarkRead(notif.id)}>
                            <div className={`h-1.5 w-1.5 rounded-full mt-2 shrink-0 ${notif.read ? "bg-transparent" : "bg-foreground"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{typeLabel[notif.type] || notif.type}</p>
                              <p className="text-[13px] font-medium leading-tight">{notif.title}</p>
                              <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(notif.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            {!notif.read && (
                              <button onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
