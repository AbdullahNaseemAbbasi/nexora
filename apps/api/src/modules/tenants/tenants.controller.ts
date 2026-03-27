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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

@ApiTags("Tenants")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantsService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUser("id") userId: string) {
    return this.tenantsService.findAllByUser(userId);
  }

  @UseGuards(TenantGuard)
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.tenantsService.findById(id);
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.tenantsService.remove(id);
  }

  @UseGuards(TenantGuard)
  @Get(":id/members")
  async getMembers(@Param("id") id: string) {
    return this.tenantsService.getMembers(id);
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles("ADMIN")
  @Patch(":id/members/:userId")
  async updateMemberRole(
    @Param("id") tenantId: string,
    @Param("userId") userId: string,
    @Body("role") role: string,
  ) {
    return this.tenantsService.updateMemberRole(tenantId, userId, role);
  }

  @UseGuards(TenantGuard, RolesGuard)
  @Roles("ADMIN")
  @Delete(":id/members/:userId")
  async removeMember(
    @Param("id") tenantId: string,
    @Param("userId") userId: string,
  ) {
    return this.tenantsService.removeMember(tenantId, userId);
  }

  // ===== INVITATIONS =====

  @UseGuards(TenantGuard, RolesGuard)
  @Roles("ADMIN", "MANAGER")
  @Post(":id/invitations")
  async invite(
    @Param("id") tenantId: string,
    @Body() body: { email: string; role?: string },
  ) {
    return this.tenantsService.inviteMember(tenantId, body.email, body.role);
  }

  @Get(":id/invitations")
  @UseGuards(TenantGuard)
  async getInvitations(@Param("id") tenantId: string) {
    return this.tenantsService.getInvitations(tenantId);
  }

  @Post("join/:token")
  async joinByInvitation(
    @Param("token") token: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.tenantsService.acceptInvitation(token, userId);
  }
}
