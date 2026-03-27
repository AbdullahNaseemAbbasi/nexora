import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { ActivityService } from "./activity.service";

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ActivityService],
  exports: [ActivityService],
})
export class AnalyticsModule {}
