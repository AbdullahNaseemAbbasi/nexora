"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { BarChart2, Loader2, TrendingUp, CheckCircle2, ListTodo, Users } from "lucide-react";
import { useTenantStore } from "@/stores/tenant-store";
import apiClient from "@/lib/api-client";

interface DetailedStats {
  statusData: { name: string; value: number; key: string }[];
  priorityData: { name: string; value: number; key: string }[];
  projectProgress: { name: string; progress: number; total: number; done: number }[];
  trendData: { date: string; created: number; done: number }[];
  topAssignees: { name: string; tasks: number }[];
  completionRate: number;
  totalTasks: number;
}

// Monochrome color palette
const COLORS = ["#ffffff", "#a1a1aa", "#52525b", "#27272a"];
const PRIORITY_COLORS: Record<string, string> = {
  Low: "#3f3f46",
  Medium: "#71717a",
  High: "#a1a1aa",
  Urgent: "#ffffff",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        {label && <p className="font-medium mb-1 text-muted-foreground">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || "inherit" }}>
            {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTenant) { setLoading(false); return; }
    setLoading(true);
    apiClient.get("/analytics/detailed")
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentTenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  const completedTasks = stats.statusData.find((s) => s.key === "DONE")?.value || 0;
  const inProgressTasks = stats.statusData.find((s) => s.key === "IN_PROGRESS")?.value || 0;
  const todoTasks = stats.statusData.find((s) => s.key === "TODO")?.value || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <BarChart2 className="h-5 w-5" strokeWidth={1.75} />
          <h1 className="text-2xl font-semibold">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Project and team performance overview
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total tasks",
            value: stats.totalTasks,
            icon: <ListTodo className="h-4 w-4" />,
          },
          {
            label: "Completed",
            value: completedTasks,
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: "In progress",
            value: inProgressTasks,
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            label: "Completion rate",
            value: `${stats.completionRate}%`,
            icon: <Users className="h-4 w-4" />,
          },
        ].map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {stat.icon}
              <p className="text-xs">{stat.label}</p>
            </div>
            <p className="text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Task Status Pie */}
        <div className="border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Tasks by Status</h2>
          {stats.totalTasks === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No tasks yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.statusData.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {stats.statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 shrink-0">
                {stats.statusData.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                    <span className="text-xs font-medium ml-auto pl-4">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Priority Breakdown Bar */}
        <div className="border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Tasks by Priority</h2>
          {stats.totalTasks === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.priorityData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                  {stats.priorityData.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] || "#52525b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* 7-day trend */}
        <div className="border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">7-Day Task Trend</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#71717a" }} />
              <Line
                type="monotone"
                dataKey="created"
                name="Created"
                stroke="#a1a1aa"
                strokeWidth={2}
                dot={{ fill: "#a1a1aa", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="done"
                name="Completed"
                stroke="#ffffff"
                strokeWidth={2}
                dot={{ fill: "#ffffff", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Assignees */}
        <div className="border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Top Assignees</h2>
          {stats.topAssignees.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No assignments yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.topAssignees} layout="vertical" barSize={20}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="tasks" name="Tasks" fill="#a1a1aa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Project Progress */}
      {stats.projectProgress.length > 0 && (
        <div className="border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-5">Project Progress</h2>
          <div className="space-y-4">
            {stats.projectProgress.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px]">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{p.done}/{p.total} tasks</span>
                    <span className="text-xs font-medium w-8 text-right">{p.progress}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
