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
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@ApiTags("Projects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(tenantId, dto, userId);
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.projectsService.findAllByTenant(tenantId);
  }

  @Get(":id")
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ) {
    return this.projectsService.findById(tenantId, id);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @Patch(":id")
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto, tenantId, userId);
  }

  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.projectsService.remove(id, tenantId, userId);
  }
}
