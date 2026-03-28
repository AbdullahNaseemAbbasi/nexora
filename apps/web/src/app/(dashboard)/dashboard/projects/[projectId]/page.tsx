"use client";

import { useEffect, useState } from "react";
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

      {/* Kanban Board with Drag & Drop */}
      <DndContext
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
      </DndContext>

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
