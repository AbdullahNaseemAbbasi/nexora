"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { useTenantStore } from "@/stores/tenant-store";
import { getSocket } from "@/lib/socket";
import {
  CheckSquare, Clock, Circle, ArrowUpRight, Loader2,
  AlertCircle, ChevronDown, ListTodo, BarChart3,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string };
  labels: { label: { id: string; name: string; color: string } }[];
  _count: { comments: number };
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TODO: { label: "To Do", icon: <Circle className="h-3.5 w-3.5" />, color: "text-zinc-400" },
  IN_PROGRESS: { label: "In Progress", icon: <Clock className="h-3.5 w-3.5" />, color: "text-blue-400" },
  IN_REVIEW: { label: "In Review", icon: <ArrowUpRight className="h-3.5 w-3.5" />, color: "text-purple-400" },
  DONE: { label: "Done", icon: <CheckSquare className="h-3.5 w-3.5" />, color: "text-green-400" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "text-red-400 bg-red-400/10" },
  HIGH: { label: "High", color: "text-orange-400 bg-orange-400/10" },
  MEDIUM: { label: "Medium", color: "text-yellow-400 bg-yellow-400/10" },
  LOW: { label: "Low", color: "text-zinc-500 bg-zinc-500/10" },
};

const STATUS_ORDER = ["IN_PROGRESS", "IN_REVIEW", "TODO", "DONE"];

export default function MyTasksPage() {
  const { currentTenant } = useTenantStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!currentTenant) { setLoading(false); return; }
    try {
      const res = await apiClient.get("/tasks/my");
      setTasks(res.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time: refetch when a new TASK_ASSIGNED notification arrives
  useEffect(() => {
    if (!currentTenant) return;
    const socket = getSocket();

    const handleNotification = (notif: { type: string }) => {
      if (notif.type === "TASK_ASSIGNED") {
        fetchTasks();
      }
    };

    socket.on("notification:new", handleNotification);
    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [currentTenant, fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    try {
      await apiClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  // Group by status
  const grouped = STATUS_ORDER.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = filteredTasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "DONE").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    overdue: tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            My Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All tasks assigned to you across every project
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, icon: <ListTodo className="h-3.5 w-3.5" /> },
          { label: "In Progress", value: stats.inProgress, icon: <Clock className="h-3.5 w-3.5 text-blue-400" /> },
          { label: "Completed", value: stats.done, icon: <CheckSquare className="h-3.5 w-3.5 text-green-400" /> },
          { label: "Overdue", value: stats.overdue, icon: <AlertCircle className="h-3.5 w-3.5 text-red-400" /> },
        ].map((s) => (
          <div key={s.label} className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              {s.icon}
              <span className="text-xs">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-border pb-3">
        {[
          { key: "all", label: "All" },
          { key: "IN_PROGRESS", label: "In Progress" },
          { key: "IN_REVIEW", label: "In Review" },
          { key: "TODO", label: "To Do" },
          { key: "DONE", label: "Done" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filter === tab.key
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            {tab.label}
            {tab.key === "all" ? (
              <span className="ml-1.5 text-[10px] opacity-60">{tasks.length}</span>
            ) : (
              <span className="ml-1.5 text-[10px] opacity-60">
                {tasks.filter((t) => t.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <CheckSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "No tasks assigned to you yet" : `No ${filter.toLowerCase().replace("_", " ")} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map((status) => {
            const group = grouped[status];
            if (filter !== "all" && filter !== status) return null;
            if (group.length === 0) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
                  {cfg.icon}
                  <span className="text-xs font-medium uppercase tracking-wide">{cfg.label}</span>
                  <span className="text-xs opacity-50">{group.length}</span>
                </div>
                <div className="space-y-1.5">
                  {group.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      updating={updatingId === task.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onStatusChange,
  updating,
}: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  updating: boolean;
}) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div className="group flex items-center gap-3 border border-border rounded-lg px-3 py-2.5 hover:bg-foreground/[0.02] transition-colors">
      {/* Status toggle */}
      <div className="relative">
        <button
          onClick={() => setStatusMenuOpen((v) => !v)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded border border-transparent hover:border-border transition-colors ${cfg.color}`}
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : cfg.icon}
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </button>
        {statusMenuOpen && (
          <div className="absolute left-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[130px]">
            {Object.entries(STATUS_CONFIG).map(([key, s]) => (
              <button
                key={key}
                onClick={() => {
                  onStatusChange(task.id, key);
                  setStatusMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-foreground/5 transition-colors ${s.color} ${task.status === key ? "bg-foreground/5" : ""}`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
      </div>

      {/* Project badge */}
      <Link
        href={`/dashboard/projects/${task.project.id}`}
        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-1.5 py-0.5 shrink-0 hidden sm:block"
      >
        {task.project.name}
      </Link>

      {/* Priority */}
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 hidden md:block ${priorityCfg.color}`}>
        {priorityCfg.label}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className={`text-[11px] shrink-0 ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      )}

      {/* Comments count */}
      {task._count.comments > 0 && (
        <span className="text-[11px] text-muted-foreground shrink-0">{task._count.comments} 💬</span>
      )}
    </div>
  );
}
