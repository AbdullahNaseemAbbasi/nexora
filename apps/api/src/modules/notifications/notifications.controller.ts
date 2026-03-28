import { Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser("id") userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.notificationsService.findAll(userId, tenantId);
  }

  @Get("count")
  getUnreadCount(
    @CurrentUser("id") userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.notificationsService.getUnreadCount(userId, tenantId);
  }

  @Patch(":id/read")
  markRead(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.notificationsService.markRead(id, userId);
  }

  @Patch("read-all")
  markAllRead(
    @CurrentUser("id") userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.notificationsService.markAllRead(userId, tenantId);
  }
}
