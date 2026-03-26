import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, projectId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        tenantId,
        projectId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || "MEDIUM",
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
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
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
