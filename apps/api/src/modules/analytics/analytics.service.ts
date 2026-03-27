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
}
