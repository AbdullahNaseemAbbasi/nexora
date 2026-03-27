"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, UserCog, User } from "lucide-react";
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

export default function TeamPage() {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTenant) return;
    apiClient
      .get(`/tenants/${currentTenant.id}/members`)
      .then((res) => setMembers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentTenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Members of {currentTenant?.name}
        </p>
      </div>

      <div className="border border-border rounded-lg divide-y divide-border">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-5 py-4"
          >
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
                <p className="text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded ${roleBadge[member.role]}`}>
              {roleIcon[member.role]}
              {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
