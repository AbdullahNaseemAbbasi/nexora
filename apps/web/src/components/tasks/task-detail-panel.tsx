"use client";

import { useEffect, useState } from "react";
import { X, Send, Circle, CheckCircle2, Clock, Eye, Loader2, UserPlus, Trash2, Calendar, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { useTenantStore } from "@/stores/tenant-store";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assignments: {
    user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  }[];
  comments: Comment[];
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

  useEffect(() => {
    fetchTask();
    fetchComments();
    if (currentTenant) fetchTeamMembers();
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
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, { priority });
      fetchTask();
      onUpdate();
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}/tasks/${taskId}/assign/${userId}`);
      fetchTask();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDescription = async () => {
    try {
      await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, {
        description: descValue,
      });
      fetchTask();
      onUpdate();
      setEditingDesc(false);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Title */}
            <h3 className="text-lg font-semibold">{task.title}</h3>

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
