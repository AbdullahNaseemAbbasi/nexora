"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Loader2, MoreHorizontal, Archive, Trash2, ArchiveRestore, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  progress: number;
  _count: { tasks: number };
}

export default function ProjectsPage() {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!currentTenant) return;
    fetchProjects();
  }, [currentTenant]);

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiClient.post("/projects", {
        name: newName,
        description: newDesc || undefined,
      });
      setNewName("");
      setNewDesc("");
      setShowForm(false);
      fetchProjects();
      toast.success("Project created");
    } catch (err) {
      console.error("Failed to create project", err);
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure? All tasks in this project will be deleted.")) return;
    try {
      await apiClient.delete(`/projects/${projectId}`);
      fetchProjects();
      toast.success("Project deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete project");
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await apiClient.patch(`/projects/${projectId}`, { status: "ARCHIVED" });
      fetchProjects();
      toast.success("Project archived");
    } catch (err) {
      console.error(err);
      toast.error("Failed to archive project");
    }
  };

  const handleUnarchiveProject = async (projectId: string) => {
    try {
      await apiClient.patch(`/projects/${projectId}`, { status: "ACTIVE" });
      fetchProjects();
      toast.success("Project restored");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore project");
    }
  };

  const statusBadge: Record<string, string> = {
    ACTIVE: "bg-accent text-foreground",
    ARCHIVED: "bg-accent text-muted-foreground",
    COMPLETED: "bg-accent text-foreground",
  };

  const activeProjects = projects.filter((p) => p.status !== "ARCHIVED");
  const archivedProjects = projects.filter((p) => p.status === "ARCHIVED");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your team&apos;s projects
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New project
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-border rounded-lg p-5 mb-6 space-y-3"
        >
          <input
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full h-10 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors"
            autoFocus
          />
          <input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full h-10 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                "Create project"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Active Projects */}
      {activeProjects.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-medium mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {activeProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              statusBadge={statusBadge}
              onArchive={() => { handleArchiveProject(project.id); setMenuOpen(null); }}
              onUnarchive={() => { handleUnarchiveProject(project.id); setMenuOpen(null); }}
              onDelete={() => { handleDeleteProject(project.id); setMenuOpen(null); }}
            />
          ))}
        </div>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <Archive className="h-3.5 w-3.5" />
            Archived projects ({archivedProjects.length})
            <ChevronDown className={`h-3 w-3 transition-transform ${showArchived ? "rotate-180" : ""}`} />
          </button>
          {showArchived && (
            <div className="border border-border rounded-lg divide-y divide-border opacity-70">
              {archivedProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                  statusBadge={statusBadge}
                  onArchive={() => { handleArchiveProject(project.id); setMenuOpen(null); }}
                  onUnarchive={() => { handleUnarchiveProject(project.id); setMenuOpen(null); }}
                  onDelete={() => { handleDeleteProject(project.id); setMenuOpen(null); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectRow({
  project, menuOpen, setMenuOpen, statusBadge, onArchive, onUnarchive, onDelete,
}: {
  project: Project;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  statusBadge: Record<string, string>;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  const isArchived = project.status === "ARCHIVED";
  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors">
      <Link href={`/dashboard/projects/${project.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{project.name}</p>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2 w-32">
          <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
            <div className="h-full bg-foreground/40 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground w-8">{project.progress}%</span>
        </div>
        <span className="text-xs text-muted-foreground">{project._count.tasks} tasks</span>
        <span className={`text-xs px-2 py-0.5 rounded ${statusBadge[project.status] || "bg-accent"}`}>
          {project.status.toLowerCase()}
        </span>
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen(menuOpen === project.id ? null : project.id); }}
            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen === project.id && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
              <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1 w-44">
                {isArchived ? (
                  <button
                    onClick={onUnarchive}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Restore project
                  </button>
                ) : (
                  <button
                    onClick={onArchive}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive/70 hover:bg-accent hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
