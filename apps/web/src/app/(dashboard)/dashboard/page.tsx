"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";
import { Circle, CheckCircle2, ArrowRight, Loader2, Activity } from "lucide-react";

interface Overview {
  totalProjects: number;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  inReviewTasks: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: { name: string };
}

const statusIcon: Record<string, React.ReactNode> = {
  TODO: <Circle className="h-4 w-4 text-muted-foreground/40" strokeWidth={1.5} />,
  IN_PROGRESS: <Circle className="h-4 w-4 text-foreground/60" strokeWidth={2.5} />,
  IN_REVIEW: <Circle className="h-4 w-4 text-foreground/40" strokeWidth={2} />,
  DONE: <CheckCircle2 className="h-4 w-4 text-foreground/50" strokeWidth={2} />,
};

const statusLabel: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tasks, setTasks] = useState<RecentTask[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTenant) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const [overviewRes, activityRes] = await Promise.all([
          apiClient.get("/analytics/overview"),
          apiClient.get("/analytics/activity").catch(() => ({ data: [] })),
        ]);
        setActivities(activityRes.data || []);
        setOverview(overviewRes.data);
        setLoading(false);

        // Fetch tasks in background (non-blocking)
        apiClient.get("/projects").then(async (projectsRes) => {
          const allTasks: RecentTask[] = [];
          const projectPromises = projectsRes.data.slice(0, 3).map(async (project: any) => {
            try {
              const tasksRes = await apiClient.get(`/projects/${project.id}/tasks`);
              for (const task of tasksRes.data.slice(0, 3)) {
                allTasks.push({ ...task, project: { name: project.name } });
              }
            } catch {}
          });
          await Promise.all(projectPromises);
          setTasks(allTasks.slice(0, 8));
        }).catch(() => {});
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentTenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          {greeting}, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s an overview of {currentTenant?.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total projects", value: overview?.totalProjects || 0 },
          { label: "In progress", value: overview?.inProgressTasks || 0 },
          { label: "Completed", value: overview?.completedTasks || 0 },
          { label: "Team members", value: overview?.totalMembers || 0 },
        ].map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-semibold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      {tasks.length > 0 && (
        <div className="border border-border rounded-lg">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent tasks</h2>
            <Link
              href="/dashboard/projects"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div>
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                  index !== tasks.length - 1 ? "border-b border-border" : ""
                }`}
              >
                {statusIcon[task.status]}
                <span className="text-sm flex-1">{task.title}</span>
                <span className="text-xs text-muted-foreground bg-accent px-2.5 py-1 rounded hidden sm:block">
                  {task.project.name}
                </span>
                <span className="text-xs text-muted-foreground w-24 text-right">
                  {statusLabel[task.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activities.length > 0 && (
        <div className="border border-border rounded-lg mt-6">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent activity</h2>
          </div>
          <div>
            {activities.slice(0, 10).map((activity: any, index: number) => (
              <div
                key={activity.id}
                className={`flex items-center gap-3 px-5 py-2.5 ${
                  index !== Math.min(activities.length, 10) - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="h-6 w-6 bg-accent rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-medium">
                    {activity.user?.firstName?.[0]}{activity.user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium">{activity.user?.firstName} {activity.user?.lastName}</span>
                    {" "}
                    <span className="text-muted-foreground">{activity.action.replace(/_/g, " ")}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
