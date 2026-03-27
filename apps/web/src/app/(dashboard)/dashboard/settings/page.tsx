"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/stores/tenant-store";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Building2, Plus, User, Lock } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { currentTenant, setTenants } = useTenantStore();

  // Create workspace form
  const [showCreate, setShowCreate] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [creating, setCreating] = useState(false);

  // Update org
  const [editName, setEditName] = useState(currentTenant?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile edit
  const [editFirstName, setEditFirstName] = useState(user?.firstName || "");
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) return;
    setCreating(true);
    try {
      await apiClient.post("/tenants", { name: orgName, slug: orgSlug });
      // Refresh tenants
      const res = await apiClient.get("/tenants");
      setTenants(res.data);
      setOrgName("");
      setOrgSlug("");
      setShowCreate(false);
      toast.success("Workspace created");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      await apiClient.patch("/users/profile", { firstName: editFirstName, lastName: editLastName });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setChangingPassword(true);
    try {
      await apiClient.post("/users/change-password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdateOrg = async () => {
    if (!editName.trim() || !currentTenant) return;
    setSaving(true);
    try {
      await apiClient.patch(`/tenants/${currentTenant.id}`, { name: editName });
      const res = await apiClient.get("/tenants");
      setTenants(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Workspace updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Manage your workspace and account settings.
      </p>

      {/* Profile Section */}
      <div className="border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Profile</h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">First name</label>
              <input
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Last name</label>
              <input
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <p className="text-sm mt-1 text-muted-foreground">{user?.email}</p>
          </div>
          <Button size="sm" onClick={handleUpdateProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Save profile
          </Button>
        </div>
      </div>

      {/* Password Change */}
      <div className="border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Change password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors mt-1"
            />
          </div>
          <Button size="sm" type="submit" disabled={changingPassword}>
            {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Change password
          </Button>
        </form>
      </div>

      {/* Workspace Settings */}
      <div className="border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Workspace — {currentTenant?.name}</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Workspace name</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors"
              />
              <Button size="sm" onClick={handleUpdateOrg} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? "Saved!" : "Save"}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Plan</label>
            <p className="text-sm mt-1">{currentTenant?.plan || "FREE"}</p>
          </div>
        </div>
      </div>

      {/* Create New Workspace */}
      <div className="border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Create new workspace</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "Create"}
          </Button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreateWorkspace} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <input
                placeholder="My Company"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                }}
                className="w-full h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Slug (URL-friendly)</label>
              <input
                placeholder="my-company"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="w-full h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none focus:border-foreground/30 transition-colors mt-1"
              />
            </div>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                "Create workspace"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
