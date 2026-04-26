import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Single endpoint that returns all data the dashboard layout needs to populate
 * its store. Backend runs the 7 underlying Prisma queries in parallel via
 * Promise.all, so total wall-clock time = max(individual query) instead of sum.
 * Frontend goes from 7 round-trips to 1.
 */
@ApiTags("Bootstrap")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller("dashboard")
export class BootstrapController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("init")
  async init(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
  ) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalProjects,
      totalMembers,
      tasksByStatus,
      tasksByPriority,
      myTasks,
      projects,
      members,
      invitations,
      activity,
      projectsForProgress,
      recentTasksForTrend,
      memberTaskCounts,
    ] = await Promise.all([
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.tenantMember.count({ where: { tenantId } }),
      this.prisma.task.groupBy({ by: ["status"], where: { tenantId }, _count: true }),
      this.prisma.task.groupBy({ by: ["priority"], where: { tenantId }, _count: true }),
      this.prisma.task.findMany({
        where: { tenantId, assignments: { some: { userId } } },
        include: {
          project: { select: { id: true, name: true } },
          assignments: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          },
          labels: { include: { label: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      this.prisma.project.findMany({
        where: { tenantId },
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.tenantMember.findMany({
        where: { tenantId },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.invitation.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.activity.findMany({
        where: { tenantId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.project.findMany({
        where: { tenantId, status: "ACTIVE" },
        include: { tasks: { select: { status: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      this.prisma.task.findMany({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.taskAssignment.groupBy({
        by: ["userId"],
        where: { task: { tenantId } },
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: 5,
      }),
    ]);

    // Build overview
    const statusCounts: Record<string, number> = {};
    let totalTasks = 0;
    for (const g of tasksByStatus) {
      statusCounts[g.status] = g._count;
      totalTasks += g._count;
    }
    const overview = {
      totalProjects,
      totalMembers,
      totalTasks,
      tasksByStatus: statusCounts,
      completedTasks: statusCounts["DONE"] || 0,
      inProgressTasks: statusCounts["IN_PROGRESS"] || 0,
      todoTasks: statusCounts["TODO"] || 0,
      inReviewTasks: statusCounts["IN_REVIEW"] || 0,
    };

    // Build projects with progress
    const projectsWithProgress = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      const { tasks, ...rest } = p;
      return { ...rest, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
    });

    // Build detailed analytics
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

    const projectProgress = projectsForProgress.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      return {
        name: p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        total,
        done,
      };
    });

    const trendMap: Record<string, { created: number; done: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trendMap[key] = { created: 0, done: 0 };
    }
    for (const t of recentTasksForTrend) {
      const key = new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (trendMap[key]) {
        trendMap[key].created += 1;
        if (t.status === "DONE") trendMap[key].done += 1;
      }
    }
    const trendData = Object.entries(trendMap).map(([date, c]) => ({ date, ...c }));

    const userIds = memberTaskCounts.map((m) => m.userId);
    const usersForAssignees = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const topAssignees = memberTaskCounts.map((m) => {
      const u = usersForAssignees.find((u) => u.id === m.userId);
      return {
        name: u ? `${u.firstName} ${u.lastName}` : "Unknown",
        tasks: m._count,
      };
    });

    const completionRate =
      totalTasks > 0
        ? Math.round(((statusCounts["DONE"] || 0) / totalTasks) * 100)
        : 0;

    const detailedStats = {
      statusData,
      priorityData,
      projectProgress,
      trendData,
      topAssignees,
      completionRate,
      totalTasks,
    };

    return {
      overview,
      myTasks,
      projects: projectsWithProgress,
      members,
      invitations,
      activity,
      detailedStats,
    };
  }
}
