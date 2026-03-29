import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { UserTasksController } from "./user-tasks.controller";
import { TasksService } from "./tasks.service";
import { AnalyticsModule } from "../analytics/analytics.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AnalyticsModule, NotificationsModule],
  controllers: [TasksController, UserTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
// RealtimeGateway is global — injected automatically via RealtimeModule
