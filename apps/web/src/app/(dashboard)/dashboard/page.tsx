"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Circle, CheckCircle2, ArrowRight } from "lucide-react";

const recentTasks = [
  { title: "Design new homepage mockup", status: "DONE", priority: "High", project: "Website Redesign" },
  { title: "Implement hero section", status: "IN_PROGRESS", priority: "High", project: "Website Redesign" },
  { title: "Build login screen", status: "IN_PROGRESS", priority: "High", project: "Mobile App" },
  { title: "Setup contact form backend", status: "TODO", priority: "Medium", project: "Website Redesign" },
  { title: "Write unit tests", status: "IN_REVIEW", priority: "Medium", project: "Website Redesign" },
  { title: "Integrate push notifications", status: "TODO", priority: "Medium", project: "Mobile App" },
];

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
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Good evening, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s an overview of your workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total projects", value: "3" },
          { label: "In progress", value: "4" },
          { label: "Completed", value: "3" },
          { label: "Team members", value: "2" },
        ].map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-semibold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="border border-border rounded-lg">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent tasks</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          {recentTasks.map((task, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                index !== recentTasks.length - 1 ? "border-b border-border" : ""
              }`}
            >
              {statusIcon[task.status]}
              <span className="text-sm flex-1">{task.title}</span>
              <span className="text-xs text-muted-foreground bg-accent px-2.5 py-1 rounded hidden sm:block">
                {task.project}
              </span>
              <span className="text-xs text-muted-foreground w-24 text-right">
                {statusLabel[task.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
