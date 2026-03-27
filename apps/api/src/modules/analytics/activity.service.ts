import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    tenantId: string,
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: any,
  ) {
    return this.prisma.activity.create({
      data: { tenantId, userId, action, entity, entityId, metadata },
    });
  }

  async getByTenant(tenantId: string, limit = 20) {
    return this.prisma.activity.findMany({
      where: { tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
