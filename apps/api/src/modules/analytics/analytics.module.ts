import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { ActivityService } from "./activity.service";
import { BootstrapController } from "./bootstrap.controller";

@Module({
  controllers: [AnalyticsController, BootstrapController],
  providers: [AnalyticsService, ActivityService],
  exports: [ActivityService],
})
export class AnalyticsModule {}
