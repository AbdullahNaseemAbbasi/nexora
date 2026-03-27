import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { AnalyticsService } from "./analytics.service";
import { ActivityService } from "./activity.service";

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly activityService: ActivityService,
  ) {}

  @Get("overview")
  async getOverview(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getOverview(tenantId);
  }

  @Get("search")
  async search(
    @CurrentTenant() tenantId: string,
    @Query("q") query: string,
  ) {
    return this.analyticsService.search(tenantId, query);
  }

  @Get("activity")
  async getActivity(
    @CurrentTenant() tenantId: string,
    @Query("limit") limit?: string,
  ) {
    return this.activityService.getByTenant(
      tenantId,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
