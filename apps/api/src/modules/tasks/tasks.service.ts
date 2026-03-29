import { Injectable, NotFoundException } from "@nestjs/common";
import { Priority, TaskStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ActivityService } from "../analytics/activity.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(
    tenantId: string,
    projectId: string,
    dto: CreateTaskDto,
    actorId?: string,
  ) {
    const task = await this.prisma.task.create({
      data: {
        tenantId,
        projectId,
        title: dto.title,
        description: dto.description,
        priority: (dto.priority || "MEDIUM") as Priority,
        status: dto.status ? (dto.status as any) : undefined,
        estimate: dto.estimate ?? undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    if (actorId) {
      this.activityService
        .log(tenantId, actorId, "TASK_CREATED", "task", task.id, {
          title: task.title,
        })
        .catch(() => null);
    }

    this.realtime.emitTaskCreated(projectId, task);
    return task;
  }

  async findAllByProject(tenantId: string, projectId: string) {
    return this.prisma.task.findMany({
      where: { tenantId, projectId },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        labels: {
          include: { label: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { position: "asc" },
    });
  }

  async findById(tenantId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        labels: {
          include: { label: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    tenantId?: string,
    actorId?: string,
  ) {
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status as TaskStatus | undefined,
        priority: dto.priority as Priority | undefined,
        position: dto.position,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimate: dto.estimate,
      },
    });

    if (tenantId && actorId) {
      const action = dto.status ? "TASK_STATUS_CHANGED" : "TASK_UPDATED";
      this.activityService
        .log(tenantId, actorId, action, "task", task.id, {
          title: task.title,
          status: dto.status,
        })
        .catch(() => null);
    }

    this.realtime.emitTaskUpdated(task.projectId, task);
    return task;
  }

  async remove(id: string, tenantId?: string, actorId?: string) {
    const task = await this.prisma.task.findFirst({ where: { id } });
    const result = await this.prisma.task.delete({ where: { id } });

    if (tenantId && actorId && task) {
      this.activityService
        .log(tenantId, actorId, "TASK_DELETED", "task", id, {
          title: task.title,
        })
        .catch(() => null);
    }

    if (task) {
      this.realtime.emitTaskDeleted(task.projectId, id);
    }
    return result;
  }

  // ===== COMMENTS =====

  async getComments(taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async addComment(
    taskId: string,
    userId: string,
    content: string,
    tenantId?: string,
  ) {
    const comment = await this.prisma.taskComment.create({
      data: { taskId, userId, content },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    if (tenantId) {
      this.activityService
        .log(tenantId, userId, "TASK_COMMENTED", "task", taskId, {
          commentId: comment.id,
        })
        .catch(() => null);
    }

    return comment;
  }

  // ===== ASSIGNMENTS =====

  async assignUser(
    taskId: string,
    assigneeId: string,
    tenantId?: string,
    actorId?: string,
  ) {
    const assignment = await this.prisma.taskAssignment.create({
      data: { taskId, userId: assigneeId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    if (tenantId && actorId) {
      // Log activity
      this.activityService
        .log(tenantId, actorId, "TASK_ASSIGNED", "task", taskId, {
          assigneeId,
        })
        .catch(() => null);

      // Notify the assignee (only if different from actor)
      if (assigneeId !== actorId) {
        const task = await this.prisma.task
          .findFirst({ where: { id: taskId } })
          .catch(() => null);
        this.notificationsService
          .create({
            userId: assigneeId,
            tenantId,
            type: "TASK_ASSIGNED",
            title: "You were assigned to a task",
            message: task ? `You have been assigned to "${task.title}"` : "You have been assigned to a task",
            metadata: { taskId },
          })
          .catch(() => null);
      }
    }

    return assignment;
  }

  async unassignUser(
    taskId: string,
    userId: string,
    tenantId?: string,
    actorId?: string,
  ) {
    const result = await this.prisma.taskAssignment.delete({
      where: { taskId_userId: { taskId, userId } },
    });

    if (tenantId && actorId) {
      this.activityService
        .log(tenantId, actorId, "TASK_UNASSIGNED", "task", taskId, {
          userId,
        })
        .catch(() => null);
    }

    return result;
  }

  // ===== MY TASKS =====

  async findMyTasks(tenantId: string, userId: string) {
    return this.prisma.task.findMany({
      where: {
        tenantId,
        assignments: { some: { userId } },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        labels: { include: { label: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  // ===== LABELS =====

  async addLabel(taskId: string, labelId: string) {
    return this.prisma.taskLabel.create({
      data: { taskId, labelId },
      include: { label: true },
    });
  }

  async removeLabel(taskId: string, labelId: string) {
    return this.prisma.taskLabel.delete({
      where: { taskId_labelId: { taskId, labelId } },
    });
  }
}
