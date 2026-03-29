"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { useTenantStore } from "@/stores/tenant-store";
import { getSocket } from "@/lib/socket";
import {
  Activity, Plus, Edit3, Trash2, UserPlus, MessageSquare,
  FolderPlus, CheckSquare, Loader2, RefreshCw,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: (m: any) => string }> = {
  TASK_CREATED:      { icon: <Plus className="h-3.5 w-3.5" />,        color: "bg-green-500/10 text-green-400",  label: (m) => `created task "${m?.title || "Untitled"}"` },
  TASK_UPDATED:      { icon: <Edit3 className="h-3.5 w-3.5" />,       color: "bg-blue-500/10 text-blue-400",    label: (m) => `updated task "${m?.title || ""}"` },
  TASK_STATUS_CHANGED:{ icon: <CheckSquare className="h-3.5 w-3.5" />, color: "bg-purple-500/10 text-purple-400", label: (m) => `moved task to ${m?.status?.replace("_", " ") || "new status"}` },
  TASK_DELETED:      { icon: <Trash2 className="h-3.5 w-3.5" />,      color: "bg-red-500/10 text-red-400",      label: (m) => `deleted task "${m?.title || ""}"` },
  TASK_ASSIGNED:     { icon: <UserPlus className="h-3.5 w-3.5" />,    color: "bg-yellow-500/10 text-yellow-400", label: () => "assigned a task" },
  TASK_UNASSIGNED:   { icon: <UserPlus className="h-3.5 w-3.5" />,    color: "bg-zinc-500/10 text-zinc-400",    label: () => "unassigned a task" },
  TASK_COMMENTED:    { icon: <MessageSquare className="h-3.5 w-3.5" />, color: "bg-blue-500/10 text-blue-400",  label: () => "commented on a task" },
  PROJECT_CREATED:   { icon: <FolderPlus className="h-3.5 w-3.5" />,  color: "bg-green-500/10 text-green-400", label: (m) => `created project "${m?.name || ""}"` },
  PROJECT_UPDATED:   { icon: <Edit3 className="h-3.5 w-3.5" />,       color: "bg-blue-500/10 text-blue-400",   label: (m) => `updated project "${m?.name || ""}"` },
};

const DEFAULT_ACTION = {
  icon: <Activity className="h-3.5 w-3.5" />,
  color: "bg-zinc-500/10 text-zinc-400",
  label: (m: any) => `performed an action`,
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(items: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {};
  items.forEach((item) => {
    const d = new Date(item.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let key: string;
    if (d.toDateString() === today.toDateString()) key = "Today";
    else if (d.toDateString() === yesterday.toDateString()) key = "Yesterday";
    else key = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

export default function ActivityPage() {
  const { currentTenant } = useTenantStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(
    async (showRefresh = false) => {
      if (!currentTenant) return;
      if (showRefresh) setRefreshing(true);
      try {
        const res = await apiClient.get(`/analytics/activity?limit=${limit}`);
        setActivities(res.data || []);
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentTenant, limit]
  );

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Real-time: listen for new activity events on the tenant room
  useEffect(() => {
    if (!currentTenant) return;
    const socket = getSocket();

    const handleNewActivity = (activity: ActivityItem) => {
      setActivities((prev) => [activity, ...prev]);
    };

    socket.on("activity:new", handleNewActivity);
    return () => {
      socket.off("activity:new", handleNewActivity);
    };
  }, [currentTenant]);

  const grouped = groupByDate(activities);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Activity Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All actions taken in {currentTenant?.name}
          </p>
        </div>
        <button
          onClick={() => fetchActivity(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Actions like creating tasks, updating projects, and assigning members will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
                {date}
              </p>
              <div className="space-y-1">
                {items.map((item, i) => {
                  const config = ACTION_CONFIG[item.action] || DEFAULT_ACTION;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-foreground/[0.02] transition-colors group"
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${config.color}`}>
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">
                            {item.user.firstName} {item.user.lastName}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {config.label(item.metadata)}
                          </span>
                        </p>
                      </div>

                      {/* Time */}
                      <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {activities.length >= limit && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setLimit((l) => l + 50)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-4 py-2"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
