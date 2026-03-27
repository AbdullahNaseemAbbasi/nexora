"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";
import { Circle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTenant) return;

    const fetchData = async () => {
      try {
        const [overviewRes, projectsRes] = await Promise.all([
          apiClient.get("/analytics/overview"),
          apiClient.get("/projects"),
        ]);
        setOverview(overviewRes.data);

        // Get recent tasks from first project
        const allTasks: RecentTask[] = [];
        for (const project of projectsRes.data.slice(0, 3)) {
          const tasksRes = await apiClient.get(`/projects/${project.id}/tasks`);
          for (const task of tasksRes.data.slice(0, 3)) {
            allTasks.push({ ...task, project: { name: project.name } });
          }
        }
        setTasks(allTasks.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
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
    </div>
  );
}
