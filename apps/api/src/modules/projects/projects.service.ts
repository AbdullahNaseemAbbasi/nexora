import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ProjectStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ActivityService } from "../analytics/activity.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(tenantId: string, dto: CreateProjectDto, actorId?: string) {
    // Check plan project limit
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const limits: Record<string, number> = { FREE: 3, PRO: Infinity, ENTERPRISE: Infinity };
    const limit = limits[tenant?.plan || "FREE"];
    if (limit !== Infinity) {
      const count = await this.prisma.project.count({ where: { tenantId } });
      if (count >= limit) {
        throw new BadRequestException(
          `Project limit reached for your plan (${limit} projects). Upgrade to create more.`,
        );
      }
    }

    const project = await this.prisma.project.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
      },
    });

    if (actorId) {
      this.activityService
        .log(tenantId, actorId, "PROJECT_CREATED", "project", project.id, {
          name: project.name,
        })
        .catch(() => null);
    }

    return project;
  }

  async findAllByTenant(tenantId: string) {
    const projects = await this.prisma.project.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return projects.map((project) => {
      const total = project.tasks.length;
      const done = project.tasks.filter((t) => t.status === "DONE").length;
      const { tasks, ...rest } = project;
      return { ...rest, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
  }

  async findById(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        tasks: {
          orderBy: { position: "asc" },
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
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, tenantId?: string, actorId?: string) {
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as ProjectStatus | undefined,
      },
    });

    if (tenantId && actorId) {
      this.activityService
        .log(tenantId, actorId, "PROJECT_UPDATED", "project", project.id, {
          name: project.name,
          status: dto.status,
        })
        .catch(() => null);
    }

    return project;
  }

  async remove(id: string, tenantId?: string, actorId?: string) {
    const project = await this.prisma.project.findFirst({ where: { id } });
    const result = await this.prisma.project.delete({ where: { id } });

    if (tenantId && actorId && project) {
      this.activityService
        .log(tenantId, actorId, "PROJECT_DELETED", "project", id, {
          name: project.name,
        })
        .catch(() => null);
    }

    return result;
  }
}
