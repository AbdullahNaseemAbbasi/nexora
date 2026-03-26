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
}
