import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { AnalyticsModule } from "../analytics/analytics.module";

@Module({
  imports: [AnalyticsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
