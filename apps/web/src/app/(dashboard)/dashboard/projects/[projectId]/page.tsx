"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Circle,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import TaskDetailPanel from "@/components/tasks/task-detail-panel";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  tasks: Task[];
  _count: { tasks: number };
}

const columns = [
  { key: "TODO", label: "Todo", icon: Circle },
  { key: "IN_PROGRESS", label: "In Progress", icon: Clock },
  { key: "IN_REVIEW", label: "In Review", icon: Eye },
  { key: "DONE", label: "Done", icon: CheckCircle2 },
];

const priorityDot: Record<string, string> = {
  LOW: "bg-muted-foreground/30",
  MEDIUM: "bg-muted-foreground/60",
  HIGH: "bg-foreground/70",
  URGENT: "bg-foreground",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await apiClient.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error("Failed to fetch project", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await apiClient.post(`/projects/${projectId}/tasks`, {
        title: newTitle,
      });
      setNewTitle("");
      setShowForm(false);
      fetchProject();
    } catch (err) {
      console.error("Failed to create task", err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-muted-foreground">Project not found.</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projects"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New task
        </Button>
      </div>

      {/* Create Task Form */}
      {showForm && (
        <form
          onSubmit={handleCreateTask}
          className="border border-border rounded-lg p-4 mb-6 flex items-center gap-3"
        >
          <input
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors"
            autoFocus
          />
          <Button size="sm" type="submit" disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </form>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 max-w-xs border border-border rounded-lg px-3 h-9">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                priorityFilter === p
                  ? "bg-foreground text-background"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const tasks = project.tasks
            .filter((t) => t.status === col.key)
            .filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter((t) => !priorityFilter || t.priority === priorityFilter);
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2 px-1 pb-2">
                <col.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground/50 ml-auto">
                  {tasks.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="border border-border rounded-lg p-3 hover:border-foreground/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${priorityDot[task.priority]}`} />
                      <p className="text-sm leading-snug">{task.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Panel */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          projectId={projectId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchProject}
        />
      )}
    </div>
  );
}
