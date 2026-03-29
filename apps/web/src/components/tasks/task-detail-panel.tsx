"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { X, Send, Circle, CheckCircle2, Clock, Eye, Loader2, UserPlus, Trash2, Calendar, Pencil, Gauge, Tag, Link2, Copy, Plus, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { useTenantStore } from "@/stores/tenant-store";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

interface TaskLabel {
  label: { id: string; name: string; color: string };
}

interface SubTask {
  id: string;
  title: string;
  status: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimate: number | null;
  dueDate: string | null;
  createdAt: string;
  assignments: {
    user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  }[];
  labels: TaskLabel[];
  comments: Comment[];
  subTasks: SubTask[];
}

const statuses = [
  { key: "TODO", label: "Todo", icon: Circle },
  { key: "IN_PROGRESS", label: "In Progress", icon: Clock },
  { key: "IN_REVIEW", label: "In Review", icon: Eye },
  { key: "DONE", label: "Done", icon: CheckCircle2 },
];

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const priorityDot: Record<string, string> = {
  LOW: "bg-muted-foreground/30",
  MEDIUM: "bg-muted-foreground/60",
  HIGH: "bg-foreground/70",
  URGENT: "bg-foreground",
};

interface Props {
  taskId: string;
  projectId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface TeamMember {
  id: string;
  user: { id: string; firstName: string; lastName: string };
}

export default function TaskDetailPanel({ taskId, projectId, onClose, onUpdate }: Props) {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [newSubTask, setNewSubTask] = useState("");
  const [addingSubTask, setAddingSubTask] = useState(false);

  useEffect(() => {
    fetchTask();
    fetchComments();
    if (currentTenant) fetchTeamMembers();
  }, [taskId]);

  // Real-time: listen for task updates and new comments
  useEffect(() => {
    const socket = getSocket();

    const handleTaskUpdated = (updatedTask: { id: string }) => {
      if (updatedTask.id === taskId) fetchTask();
    };

    const handleTaskComment = ({ taskId: tid, comment }: { taskId: string; comment: Comment }) => {
      if (tid === taskId) {
        setComments((prev) => {
          if (prev.find((c) => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      }
    };

    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:comment", handleTaskComment);

    return () => {
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:comment", handleTaskComment);
    };
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/tasks/${taskId}`);
      setTask(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/tasks/${taskId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, { status });
      fetchTask();
      onUpdate();
      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, { priority });
      fetchTask();
      onUpdate();
      toast.success("Priority updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update priority");
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await apiClient.get(`/tenants/${currentTenant!.id}/members`);
      setTeamMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      await apiClient.post(`/projects/${projectId}/tasks/${taskId}/assign`, { userId });
      fetchTask();
      onUpdate();
      setShowAssign(false);
      toast.success("Member assigned");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign member");
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/tasks/${taskId}/assign/${userId}`);
      fetchTask();
      onUpdate();
      toast.success("Member unassigned");
    } catch (err) {
      console.error(err);
      toast.error("Failed to unassign member");
    }
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim()) return;
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, { title: titleValue });
      fetchTask();
      onUpdate();
      setEditingTitle(false);
      toast.success("Title updated");
    } catch { toast.error("Failed to update title"); }
  };

  const handleSaveDescription = async () => {
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, {
        description: descValue,
      });
      fetchTask();
      onUpdate();
      setEditingDesc(false);
      toast.success("Description updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update description");
    }
  };

  const handleDueDateChange = async (date: string) => {
    setDueDate(date);
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, {
        dueDate: date || null,
      });
      fetchTask();
      onUpdate();
      toast.success("Due date updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update due date");
    }
  };

  const handleEstimateChange = async (estimate: number | null) => {
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, { estimate });
      fetchTask();
      onUpdate();
      toast.success("Estimate updated");
    } catch { toast.error("Failed to update estimate"); }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard/projects/${projectId}?task=${taskId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleDuplicate = async () => {
    if (!task) return;
    try {
      await apiClient.post(`/projects/${projectId}/tasks`, {
        title: `${task.title} (copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimate: task.estimate,
      });
      onUpdate();
      toast.success("Task duplicated");
    } catch {
      toast.error("Failed to duplicate task");
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTask.trim()) return;
    setAddingSubTask(true);
    try {
      await apiClient.post(`/projects/${projectId}/tasks`, {
        title: newSubTask,
        parentTaskId: taskId,
      });
      setNewSubTask("");
      fetchTask();
    } catch {
      toast.error("Failed to add sub-task");
    } finally {
      setAddingSubTask(false);
    }
  };

  const handleSubTaskToggle = async (subTaskId: string, done: boolean) => {
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${subTaskId}`, {
        status: done ? "DONE" : "TODO",
      });
      fetchTask();
    } catch {
      toast.error("Failed to update sub-task");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
      onUpdate();
      onClose();
      toast.success("Task deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await apiClient.post(`/projects/${projectId}/tasks/${taskId}/comments`, {
        content: newComment,
      });
      setNewComment("");
      fetchComments();
      toast.success("Comment added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-background border-l border-border h-full flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-background border-l border-border h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold">Task details</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              title="Copy link to task"
              className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDuplicate}
              title="Duplicate task"
              className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Title */}
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  className="flex-1 text-lg font-semibold bg-accent rounded-lg px-2 py-1 outline-none"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveTitle}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
              </div>
            ) : (
              <h3
                className="text-lg font-semibold cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 transition-colors"
                onClick={() => { setEditingTitle(true); setTitleValue(task.title); }}
                title="Click to edit title"
              >
                {task.title}
              </h3>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">Description</p>
                {!editingDesc && (
                  <button
                    onClick={() => { setEditingDesc(true); setDescValue(task.description || ""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    placeholder="Add a description..."
                    className="w-full h-24 bg-accent rounded-lg px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground/50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {task.description || "No description"}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due date
              </p>
              <input
                type="date"
                value={dueDate || (task.dueDate ? task.dueDate.split("T")[0] : "")}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="h-9 bg-accent rounded-lg px-3 text-sm outline-none cursor-pointer"
              />
            </div>

            {/* Estimate (Story Points) */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Estimate
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5, 8, 13].map((pts) => (
                  <button
                    key={pts}
                    onClick={() => handleEstimateChange(task.estimate === pts ? null : pts)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      task.estimate === pts
                        ? "bg-foreground text-background font-medium"
                        : "bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Labels
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map((tl) => (
                    <span
                      key={tl.label.id}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: tl.label.color + "20", color: tl.label.color }}
                    >
                      {tl.label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleStatusChange(s.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                      task.status === s.key
                        ? "bg-foreground text-background font-medium"
                        : "bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <s.icon className="h-3 w-3" strokeWidth={2} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Priority</p>
              <div className="flex gap-1.5">
                {priorities.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                      task.priority === p
                        ? "bg-foreground text-background font-medium"
                        : "bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${priorityDot[p]}`} />
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Assigned to</p>
                <button
                  onClick={() => setShowAssign(!showAssign)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <UserPlus className="h-3 w-3" />
                  Assign
                </button>
              </div>

              {/* Current assignees */}
              <div className="flex flex-wrap gap-2">
                {task.assignments.map((a) => (
                  <div key={a.user.id} className="flex items-center gap-1.5 bg-accent px-2 py-1 rounded text-xs group">
                    <div className="h-4 w-4 bg-foreground/10 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-medium">{a.user.firstName[0]}{a.user.lastName[0]}</span>
                    </div>
                    {a.user.firstName} {a.user.lastName}
                    <button
                      onClick={() => handleUnassign(a.user.id)}
                      className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {task.assignments.length === 0 && (
                  <p className="text-xs text-muted-foreground/50">No one assigned</p>
                )}
              </div>

              {/* Assign dropdown */}
              {showAssign && (
                <div className="mt-2 border border-border rounded-lg py-1">
                  {teamMembers
                    .filter((m) => !task.assignments.some((a) => a.user.id === m.user.id))
                    .map((m) => (
                      <button
                        key={m.user.id}
                        onClick={() => handleAssign(m.user.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                      >
                        <div className="h-5 w-5 bg-accent rounded-full flex items-center justify-center">
                          <span className="text-[9px] font-medium">{m.user.firstName[0]}{m.user.lastName[0]}</span>
                        </div>
                        {m.user.firstName} {m.user.lastName}
                      </button>
                    ))}
                  {teamMembers.filter((m) => !task.assignments.some((a) => a.user.id === m.user.id)).length === 0 && (
                    <p className="px-3 py-1.5 text-xs text-muted-foreground/50">Everyone is assigned</p>
                  )}
                </div>
              )}
            </div>

            {/* Created + Delete */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Created {timeAgo(task.createdAt)}
              </p>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-xs text-destructive/60 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>

            {/* Sub-tasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  Sub-tasks
                  {task.subTasks.length > 0 && (
                    <span className="ml-1 opacity-50">
                      {task.subTasks.filter((s) => s.status === "DONE").length}/{task.subTasks.length}
                    </span>
                  )}
                </p>
              </div>

              {/* Progress bar */}
              {task.subTasks.length > 0 && (
                <div className="h-1 bg-accent rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500/60 rounded-full transition-all"
                    style={{
                      width: `${(task.subTasks.filter((s) => s.status === "DONE").length / task.subTasks.length) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* Sub-task list */}
              <div className="space-y-1 mb-2">
                {task.subTasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => handleSubTaskToggle(sub.id, sub.status !== "DONE")}
                      className="shrink-0"
                    >
                      {sub.status === "DONE" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${sub.status === "DONE" ? "line-through text-muted-foreground/50" : ""}`}>
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add sub-task input */}
              <div className="flex items-center gap-2">
                <input
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubTask()}
                  placeholder="Add sub-task..."
                  className="flex-1 h-8 bg-accent rounded-lg px-3 text-xs outline-none placeholder:text-muted-foreground/40"
                />
                <button
                  onClick={handleAddSubTask}
                  disabled={addingSubTask || !newSubTask.trim()}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-accent hover:bg-foreground/10 transition-colors disabled:opacity-40"
                >
                  {addingSubTask ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Comments */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                Comments ({comments.length})
              </p>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="h-6 w-6 bg-accent rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-medium">
                        {comment.user.firstName[0]}{comment.user.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground/50">No comments yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="px-5 py-3 border-t border-border shrink-0 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 h-9 bg-accent rounded-lg px-3 text-sm outline-none placeholder:text-muted-foreground/50"
          />
          <Button size="sm" type="submit" disabled={sending || !newComment.trim()}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
