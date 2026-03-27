import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@ApiTags("Tasks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller("projects/:projectId/tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Param("projectId") projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(tenantId, projectId, dto);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Param("projectId") projectId: string,
  ) {
    return this.tasksService.findAllByProject(tenantId, projectId);
  }

  @Get(":id")
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ) {
    return this.tasksService.findById(tenantId, id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.tasksService.remove(id);
  }

  // ===== COMMENTS =====

  @Get(":id/comments")
  async getComments(@Param("id") taskId: string) {
    return this.tasksService.getComments(taskId);
  }

  @Post(":id/comments")
  async addComment(
    @Param("id") taskId: string,
    @CurrentUser("id") userId: string,
    @Body("content") content: string,
  ) {
    return this.tasksService.addComment(taskId, userId, content);
  }

  // ===== ASSIGNMENTS =====

  @Post(":id/assign")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  async assignUser(
    @Param("id") taskId: string,
    @Body("userId") userId: string,
  ) {
    return this.tasksService.assignUser(taskId, userId);
  }

  @Delete(":id/assign/:userId")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  async unassignUser(
    @Param("id") taskId: string,
    @Param("userId") userId: string,
  ) {
    return this.tasksService.unassignUser(taskId, userId);
  }
}
