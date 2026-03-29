"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
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
  GripVertical,
  Calendar,
  LayoutGrid,
  List,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import TaskDetailPanel from "@/components/tasks/task-detail-panel";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
  estimate: number | null;
  dueDate: string | null;
  assignments: {
    user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  }[];
  labels: {
    label: { id: string; name: string; color: string };
  }[];
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

// ===== LIST VIEW =====

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TODO:        { label: "To Do",       icon: <Circle className="h-3 w-3" />,       color: "text-zinc-400" },
  IN_PROGRESS: { label: "In Progress", icon: <Clock className="h-3 w-3" />,        color: "text-blue-400" },
  IN_REVIEW:   { label: "In Review",   icon: <Eye className="h-3 w-3" />,          color: "text-purple-400" },
  DONE:        { label: "Done",        icon: <CheckCircle2 className="h-3 w-3" />, color: "text-green-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-400 bg-red-400/10",
  HIGH:   "text-orange-400 bg-orange-400/10",
  MEDIUM: "text-yellow-400 bg-yellow-400/10",
  LOW:    "text-zinc-500 bg-zinc-500/10",
};

function StatusDropdown({
  taskId,
  currentStatus,
  onStatusChange,
}: {
  taskId: string;
  currentStatus: string;
  onStatusChange: (taskId: string, status: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const sc = STATUS_CONFIG[currentStatus];

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border border-transparent hover:border-border transition-colors whitespace-nowrap ${sc.color}`}
      >
        {sc.icon}
        <span>{sc.label}</span>
        <ChevronDown className="h-2.5 w-2.5 opacity-50" />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[100] bg-background border border-border rounded-lg shadow-2xl py-1 min-w-[140px]"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, s]) => (
              <button
                key={key}
                onClick={async () => {
                  setOpen(false);
                  await onStatusChange(taskId, key);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors ${s.color} ${currentStatus === key ? "bg-accent" : ""}`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function ListView({
  tasks, projectId, onTaskClick, onStatusChange,
}: {
  tasks: Task[];
  projectId: string;
  onTaskClick: (id: string) => void;
  onStatusChange: (taskId: string, status: string) => Promise<void>;
}) {
  if (tasks.length === 0) {
    return (
      <div className="border border-border rounded-lg p-12 text-center">
        <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_140px_90px_110px_80px] gap-2 px-4 py-2 bg-accent/40 border-b border-border text-xs text-muted-foreground font-medium rounded-t-lg">
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Assignees</span>
        <span>Due</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
          return (
            <div
              key={task.id}
              className="grid grid-cols-[1fr_140px_90px_110px_80px] gap-2 px-4 py-2.5 hover:bg-accent/30 transition-colors items-center last:rounded-b-lg"
            >
              {/* Title */}
              <button
                onClick={() => onTaskClick(task.id)}
                className={`text-sm text-left truncate hover:underline ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}
              >
                {task.title}
              </button>

              {/* Status — fixed-position dropdown */}
              <StatusDropdown
                taskId={task.id}
                currentStatus={task.status}
                onStatusChange={onStatusChange}
              />

              {/* Priority */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium w-fit ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
              </span>

              {/* Assignees */}
              <div className="flex -space-x-1.5">
                {task.assignments.slice(0, 3).map((a) => (
                  <div
                    key={a.user.id}
                    title={`${a.user.firstName} ${a.user.lastName}`}
                    className="h-5 w-5 bg-accent border border-background rounded-full flex items-center justify-center"
                  >
                    <span className="text-[8px] font-medium">
                      {a.user.firstName[0]}{a.user.lastName[0]}
                    </span>
                  </div>
                ))}
                {task.assignments.length === 0 && (
                  <span className="text-xs text-muted-foreground/40">—</span>
                )}
              </div>

              {/* Due date */}
              <span className={`text-[11px] ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : <span className="text-muted-foreground/40">—</span>
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Droppable Column
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[120px] rounded-lg p-1 transition-colors ${
        isOver ? "bg-accent/50" : ""
      }`}
    >
      {children}
    </div>
  );
}

// Draggable Task Card
function DraggableTask({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-border rounded-lg p-3 hover:border-foreground/20 transition-colors cursor-pointer bg-background group ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2" onClick={onClick}>
        {/* Drag Handle */}
        <button
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5">
            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${priorityDot[task.priority]}`} />
            <p className="text-sm leading-snug">{task.title}</p>
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 ml-3.5">
              {task.labels.map((tl) => (
                <span
                  key={tl.label.id}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: tl.label.color + "20", color: tl.label.color }}
                >
                  {tl.label.name}
                </span>
              ))}
            </div>
          )}

          {/* Bottom row — due date, estimate, assignees */}
          <div className="flex items-center justify-between mt-2 ml-3.5">
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
              {task.estimate && (
                <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                  {task.estimate}pt
                </span>
              )}
            </div>
            {/* Assignee avatars */}
            {task.assignments && task.assignments.length > 0 && (
              <div className="flex -space-x-1.5">
                {task.assignments.slice(0, 3).map((a) => (
                  <div
                    key={a.user.id}
                    className="h-5 w-5 bg-accent border border-background rounded-full flex items-center justify-center"
                    title={`${a.user.firstName} ${a.user.lastName}`}
                  >
                    <span className="text-[8px] font-medium">
                      {a.user.firstName[0]}{a.user.lastName[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetchProject();

    // Join project room for real-time updates
    const socket = getSocket();
    socket.emit("join-project", projectId);

    socket.on("task:updated", (updatedTask: Task) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
        };
      });
    });

    socket.on("task:created", (newTask: Task) => {
      setProject((prev) => {
        if (!prev) return prev;
        // avoid duplicate
        if (prev.tasks.find((t) => t.id === newTask.id)) return prev;
        return { ...prev, tasks: [...prev.tasks, newTask] };
      });
    });

    socket.on("task:deleted", ({ taskId }: { taskId: string }) => {
      setProject((prev) => {
        if (!prev) return prev;
        return { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) };
      });
    });

    return () => {
      socket.emit("leave-project", projectId);
      socket.off("task:updated");
      socket.off("task:created");
      socket.off("task:deleted");
    };
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
      await apiClient.post(`/projects/${projectId}/tasks`, { title: newTitle });
      setNewTitle("");
      setShowForm(false);
      fetchProject();
      toast.success("Task created");
    } catch (err) {
      console.error("Failed to create task", err);
      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Check if dropped on a valid column
    if (!columns.some((c) => c.key === newStatus)) return;

    // Find the task
    const task = project?.tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update — immediately move the task in UI
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        ),
      };
    });

    // API call
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, {
        status: newStatus,
      });
      toast.success("Task moved");
    } catch (err) {
      console.error("Failed to update task status", err);
      toast.error("Failed to move task");
      fetchProject(); // Revert on error
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
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded transition-colors ${viewMode === "board" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              title="Board view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New task
          </Button>
        </div>
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
      <div className="flex flex-wrap items-center gap-3 mb-5">
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

      {/* List View */}
      {viewMode === "list" && (
        <ListView
          tasks={project.tasks
            .filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter((t) => !priorityFilter || t.priority === priorityFilter)}
          projectId={projectId}
          onTaskClick={(id) => setSelectedTaskId(id)}
          onStatusChange={async (taskId, newStatus) => {
            setProject((prev) => prev ? {
              ...prev,
              tasks: prev.tasks.map((t) => t.id === taskId ? { ...t, status: newStatus } : t),
            } : prev);
            await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
          }}
        />
      )}

      {/* Kanban Board with Drag & Drop */}
      {viewMode === "board" && <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const tasks = project.tasks
              .filter((t) => t.status === col.key)
              .filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((t) => !priorityFilter || t.priority === priorityFilter);

            return (
              <div key={col.key}>
                <div className="flex items-center gap-2 px-1 pb-2">
                  <col.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground/50 ml-auto">
                    {tasks.length}
                  </span>
                </div>

                <DroppableColumn id={col.key}>
                  {tasks.map((task) => (
                    <DraggableTask
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTaskId(task.id)}
                    />
                  ))}
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay — ye drag karte waqt dikhta hai */}
        <DragOverlay>
          {activeTask ? (
            <div className="border border-foreground/20 rounded-lg p-3 bg-background shadow-xl w-[250px]">
              <div className="flex items-start gap-2">
                <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${priorityDot[activeTask.priority]}`} />
                <p className="text-sm leading-snug">{activeTask.title}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>}

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
