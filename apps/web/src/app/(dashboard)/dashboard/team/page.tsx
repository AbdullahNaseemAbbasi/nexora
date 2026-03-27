"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, UserCog, User, Plus, Mail, Clock, Check, X, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  createdAt: string;
}

const roleIcon: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="h-3.5 w-3.5" />,
  MANAGER: <UserCog className="h-3.5 w-3.5" />,
  MEMBER: <User className="h-3.5 w-3.5" />,
};

const roleBadge: Record<string, string> = {
  ADMIN: "bg-foreground/10 text-foreground",
  MANAGER: "bg-accent text-foreground",
  MEMBER: "bg-accent text-muted-foreground",
};

const statusIcon: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3 text-muted-foreground" />,
  ACCEPTED: <Check className="h-3 w-3 text-foreground" />,
  EXPIRED: <X className="h-3 w-3 text-muted-foreground" />,
};

export default function TeamPage() {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/tenants/${currentTenant!.id}/members/${userId}`, { role: newRole });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this member from the workspace?")) return;
    try {
      await apiClient.delete(`/tenants/${currentTenant!.id}/members/${userId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!currentTenant) return;
    fetchData();
  }, [currentTenant]);

  const fetchData = async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        apiClient.get(`/tenants/${currentTenant!.id}/members`),
        apiClient.get(`/tenants/${currentTenant!.id}/invitations`),
      ]);
      setMembers(membersRes.data);
      setInvitations(invitationsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await apiClient.post(`/tenants/${currentTenant!.id}/invitations`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setShowInvite(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setInviteError(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Members of {currentTenant?.name}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Invite member
        </Button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="border border-border rounded-lg p-5 mb-6 space-y-3">
          {inviteError && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-3 py-2 rounded-md">
              {inviteError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full h-9 bg-transparent border border-border rounded-lg px-3 pr-9 text-sm outline-none focus:border-foreground/30 transition-colors"
                autoFocus
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="h-9 bg-transparent border border-border rounded-lg px-3 text-sm outline-none cursor-pointer"
            >
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" type="submit" disabled={inviting}>
              {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
              Send invitation
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Members List */}
      <div className="border border-border rounded-lg divide-y divide-border mb-6">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-accent rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-medium">
                  {member.user.firstName[0]}{member.user.lastName[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {member.user.firstName} {member.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, member.user.id, e.target.value)}
                className="h-7 bg-accent text-xs rounded px-2 outline-none cursor-pointer border-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="MEMBER">Member</option>
              </select>
              <button
                onClick={() => handleRemoveMember(member.user.id)}
                className="p-1 text-muted-foreground/40 hover:text-destructive rounded transition-colors"
                title="Remove member"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === "PENDING").length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Pending invitations</h2>
          <div className="border border-border rounded-lg divide-y divide-border">
            {invitations
              .filter((i) => i.status === "PENDING")
              .map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-accent rounded-full flex items-center justify-center shrink-0">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">{inv.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {statusIcon[inv.status]}
                        Pending · {inv.role.charAt(0) + inv.role.slice(1).toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/join/${inv.token}`);
                    }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-accent px-2.5 py-1 rounded transition-colors"
                    title="Copy invite link"
                  >
                    <Link2 className="h-3 w-3" />
                    Copy link
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
