import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    tenantId: string;
    type: NotificationType | string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return this.prisma.notification
      .create({ data: { ...data, type: data.type as NotificationType } })
      .catch(() => null);
  }

  async findAll(userId: string, tenantId: string) {
    return this.prisma.notification.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  async getUnreadCount(userId: string, tenantId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, tenantId, read: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string, tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, tenantId, read: false },
      data: { read: true },
    });
  }
}
