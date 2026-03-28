import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AiModule } from "./modules/ai/ai.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    TasksModule,
    AnalyticsModule,
    NotificationsModule,
    AiModule,
  ],
})
export class AppModule {}
