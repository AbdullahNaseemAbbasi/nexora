"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/stores/tenant-store";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import {
  Loader2, Building2, Plus, User, Lock,
  Sparkles, Zap, Crown, Check, ExternalLink, CreditCard, MailCheck,
} from "lucide-react";

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

const plans = [
  {
    key: "FREE",
    label: "Free",
    price: "$0",
    period: "/month",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Perfect for small teams getting started",
    features: [
      "Up to 3 projects",
      "Up to 5 team members",
      "Basic analytics",
      "AI Assistant (limited)",
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    price: "$12",
    period: "/month",
    icon: <Zap className="h-4 w-4" />,
    description: "For growing teams that need more power",
    features: [
      "Unlimited projects",
      "Up to 25 team members",
      "Advanced analytics",
      "Full AI Assistant access",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    key: "ENTERPRISE",
    label: "Enterprise",
    price: "$49",
    period: "/month",
    icon: <Crown className="h-4 w-4" />,
    description: "For large organizations with full control",
    features: [
      "Unlimited everything",
      "Unlimited team members",
      "Custom analytics",
      "Dedicated AI usage",
      "SLA & priority support",
      "Custom integrations",
    ],
  },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { currentTenant, setTenants } = useTenantStore();

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

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

  // Email verification
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    if (!currentTenant) return;
    apiClient.get("/billing/subscription")
      .then((res) => setSubscription(res.data))
      .catch(() => null);
  }, [currentTenant]);

  const handleUpgrade = async (plan: "PRO" | "ENTERPRISE") => {
    setCheckoutLoading(plan);
    try {
      const res = await apiClient.post("/billing/checkout", { plan });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await apiClient.post("/billing/portal");
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "No billing account found");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) return;
    setCreating(true);
    try {
      await apiClient.post("/tenants", { name: orgName, slug: orgSlug });
      const res = await apiClient.get("/tenants");
      setTenants(res.data);
      setOrgName("");
      setOrgSlug("");
      setShowCreate(false);
      toast.success("Workspace created");
    } catch {
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
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
    } catch {
      toast.error("Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  const currentPlan = subscription?.plan || currentTenant?.plan || "FREE";

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      await apiClient.post("/auth/resend-verification");
      toast.success("Verification email sent — check your inbox");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send verification email");
    } finally {
      setResendingVerification(false);
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
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.emailVerified ? (
                <span className="flex items-center gap-1 text-[10px] text-green-500/70 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">
                  <MailCheck className="h-2.5 w-2.5" /> Verified
                </span>
              ) : (
                <span className="text-[10px] text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">
                  Unverified
                </span>
              )}
            </div>
            {!user?.emailVerified && (
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 flex items-center gap-1"
              >
                {resendingVerification ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                Resend verification email
              </button>
            )}
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
        </div>
      </div>

      {/* Billing / Plans */}
      <div className="border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Plan & Billing</h2>
          </div>
          {currentPlan !== "FREE" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Manage billing
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-5">
          Current plan: <span className="font-medium text-foreground">{currentPlan}</span>
          {subscription?.currentPeriodEnd && (
            <> · Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.key;
            const isHigher =
              (currentPlan === "FREE" && (plan.key === "PRO" || plan.key === "ENTERPRISE")) ||
              (currentPlan === "PRO" && plan.key === "ENTERPRISE");

            return (
              <div
                key={plan.key}
                className={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
                  plan.highlighted
                    ? "border-foreground/40 bg-accent/30"
                    : "border-border"
                } ${isCurrentPlan ? "ring-1 ring-foreground/20" : ""}`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-muted-foreground">{plan.icon}</span>
                    <span className="text-[13px] font-semibold">{plan.label}</span>
                    {isCurrentPlan && (
                      <span className="text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded font-medium ml-auto">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-bold">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-foreground/60 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {isHigher && !isCurrentPlan && (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleUpgrade(plan.key as "PRO" | "ENTERPRISE")}
                    disabled={checkoutLoading === plan.key}
                  >
                    {checkoutLoading === plan.key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      `Upgrade to ${plan.label}`
                    )}
                  </Button>
                )}
                {isCurrentPlan && plan.key !== "FREE" && (
                  <p className="text-[11px] text-center text-muted-foreground">Active plan</p>
                )}
                {plan.key === "FREE" && currentPlan === "FREE" && (
                  <p className="text-[11px] text-center text-muted-foreground">Your current plan</p>
                )}
              </div>
            );
          })}
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
