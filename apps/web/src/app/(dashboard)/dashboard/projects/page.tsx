"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
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
    } catch (err) {
      console.error("Failed to create project", err);
    } finally {
      setCreating(false);
    }
  };

  const statusBadge: Record<string, string> = {
    ACTIVE: "bg-accent text-foreground",
    ARCHIVED: "bg-accent text-muted-foreground",
    COMPLETED: "bg-accent text-foreground",
  };

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

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-medium mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {project._count.tasks} tasks
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${statusBadge[project.status] || "bg-accent"}`}
                >
                  {project.status.toLowerCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
