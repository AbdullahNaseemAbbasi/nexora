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
