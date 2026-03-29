import { Controller, Get, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TasksService } from "./tasks.service";
import { UpdateTaskDto } from "./dto/update-task.dto";

@ApiTags("My Tasks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller("tasks")
export class UserTasksController {
  constructor(private readonly tasksService: TasksService) {}

  // GET /tasks/my — all tasks assigned to current user across all projects
  @Get("my")
  getMyTasks(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.tasksService.findMyTasks(tenantId, userId);
  }

  // PATCH /tasks/:id/status — quick status update from My Tasks view
  @Patch(":id/status")
  updateStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.tasksService.update(id, { status } as UpdateTaskDto, tenantId, userId);
  }
}
