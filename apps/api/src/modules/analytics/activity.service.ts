import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async log(tenantId: string, userId: string, action: string, entity: string, entityId: string, metadata?: any) {
    const activity = await this.prisma.activity.create({
      data: { tenantId, userId, action, entity, entityId, metadata },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    this.realtime.emitActivity(tenantId, activity);
    return activity;
  }

  async getByTenant(tenantId: string, limit = 20) {
    return this.prisma.activity.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
