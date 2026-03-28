import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const [totalProjects, totalMembers, tasksByStatus] = await Promise.all([
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.tenantMember.count({ where: { tenantId } }),
      this.prisma.task.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    let totalTasks = 0;
    for (const group of tasksByStatus) {
      statusCounts[group.status] = group._count;
      totalTasks += group._count;
    }

    return {
      totalProjects,
      totalMembers,
      totalTasks,
      tasksByStatus: statusCounts,
      completedTasks: statusCounts["DONE"] || 0,
      inProgressTasks: statusCounts["IN_PROGRESS"] || 0,
      todoTasks: statusCounts["TODO"] || 0,
      inReviewTasks: statusCounts["IN_REVIEW"] || 0,
    };
  }

  async getDetailedStats(tenantId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      tasksByStatus,
      tasksByPriority,
      projectsWithProgress,
      recentTasks,
      memberTaskCounts,
    ] = await Promise.all([
      // Tasks by status
      this.prisma.task.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
      }),

      // Tasks by priority
      this.prisma.task.groupBy({
        by: ["priority"],
        where: { tenantId },
        _count: true,
      }),

      // Projects with task counts
      this.prisma.project.findMany({
        where: { tenantId, status: "ACTIVE" },
        include: {
          tasks: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),

      // Tasks created in last 7 days (for trend)
      this.prisma.task.findMany({
        where: {
          tenantId,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }),

      // Member task assignment counts
      this.prisma.taskAssignment.groupBy({
        by: ["userId"],
        where: { task: { tenantId } },
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: 5,
      }),
    ]);

    // Build status chart data
    const statusData = [
      { name: "Todo", value: 0, key: "TODO" },
      { name: "In Progress", value: 0, key: "IN_PROGRESS" },
      { name: "In Review", value: 0, key: "IN_REVIEW" },
      { name: "Done", value: 0, key: "DONE" },
    ];
    for (const g of tasksByStatus) {
      const found = statusData.find((s) => s.key === g.status);
      if (found) found.value = g._count;
    }

    // Build priority chart data
    const priorityData = [
      { name: "Low", value: 0, key: "LOW" },
      { name: "Medium", value: 0, key: "MEDIUM" },
      { name: "High", value: 0, key: "HIGH" },
      { name: "Urgent", value: 0, key: "URGENT" },
    ];
    for (const g of tasksByPriority) {
      const found = priorityData.find((p) => p.key === g.priority);
      if (found) found.value = g._count;
    }

    // Build project progress data
    const projectProgress = projectsWithProgress.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      return {
        name: p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        total,
        done,
      };
    });

    // Build 7-day trend
    const trendMap: Record<string, { created: number; done: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trendMap[key] = { created: 0, done: 0 };
    }
    for (const task of recentTasks) {
      const key = new Date(task.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (trendMap[key]) {
        trendMap[key].created += 1;
        if (task.status === "DONE") trendMap[key].done += 1;
      }
    }
    const trendData = Object.entries(trendMap).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    // Get member names for top assignees
    const userIds = memberTaskCounts.map((m) => m.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const topAssignees = memberTaskCounts.map((m) => {
      const u = users.find((u) => u.id === m.userId);
      return {
        name: u ? `${u.firstName} ${u.lastName}` : "Unknown",
        tasks: m._count,
      };
    });

    const totalTasks = statusData.reduce((sum, s) => sum + s.value, 0);
    const completionRate =
      totalTasks > 0
        ? Math.round((statusData.find((s) => s.key === "DONE")!.value / totalTasks) * 100)
        : 0;

    return {
      statusData,
      priorityData,
      projectProgress,
      trendData,
      topAssignees,
      completionRate,
      totalTasks,
    };
  }

  async search(tenantId: string, query: string) {
    if (!query || query.length < 2) return { projects: [], tasks: [] };

    const [projects, tasks] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          tenantId,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true, status: true },
        take: 5,
      }),
      this.prisma.task.findMany({
        where: {
          tenantId,
          title: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: { select: { name: true } },
        },
        take: 10,
      }),
    ]);

    return { projects, tasks };
  }
}
