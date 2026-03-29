import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

const PLAN_LIMITS = {
  FREE: { members: 5, projects: 3 },
  PRO: { members: 25, projects: Infinity },
  ENTERPRISE: { members: Infinity, projects: Infinity },
};

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        members: { create: { userId, role: "ADMIN" } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.tenant.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true, projects: true } } },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { members: true, projects: true } } },
    });
    if (!tenant) throw new NotFoundException("Organization not found");
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.tenant.delete({ where: { id } });
  }

  async getMembers(tenantId: string) {
    return this.prisma.tenantMember.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  }

  async updateMemberRole(tenantId: string, userId: string, role: string) {
    return this.prisma.tenantMember.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { role: role as Role },
    });
  }

  async removeMember(tenantId: string, userId: string) {
    return this.prisma.tenantMember.delete({
      where: { userId_tenantId: { userId, tenantId } },
    });
  }

  async createLabel(tenantId: string, name: string, color: string) {
    return this.prisma.label.create({ data: { tenantId, name, color } });
  }

  async getLabels(tenantId: string) {
    return this.prisma.label.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  }

  async deleteLabel(labelId: string) {
    return this.prisma.label.delete({ where: { id: labelId } });
  }

  async inviteMember(tenantId: string, email: string, role?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const limit = PLAN_LIMITS[tenant?.plan || "FREE"].members;
    if (limit !== Infinity) {
      const currentCount = await this.prisma.tenantMember.count({ where: { tenantId } });
      if (currentCount >= limit) {
        throw new BadRequestException(
          `Member limit reached for your plan (${limit} members). Upgrade to add more members.`,
        );
      }
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await this.prisma.tenantMember.findUnique({
        where: { userId_tenantId: { userId: existingUser.id, tenantId } },
      });
      if (existingMember) throw new BadRequestException("User is already a member of this workspace");
    }

    const existing = await this.prisma.invitation.findFirst({
      where: { tenantId, email, status: "PENDING" },
    });
    if (existing) throw new BadRequestException("Invitation already sent to this email");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.invitation.create({
      data: { tenantId, email, role: (role as Role) || "MEMBER", token, expiresAt },
    });
  }

  async getInvitations(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });
    if (!invitation) throw new NotFoundException("Invitation not found");
    if (invitation.status !== "PENDING") throw new BadRequestException("Invitation already used");

    if (new Date() > invitation.expiresAt) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new BadRequestException("Invitation has expired");
    }

    await this.prisma.tenantMember.create({
      data: { userId, tenantId: invitation.tenantId, role: invitation.role },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    return { message: "Successfully joined workspace" };
  }
}
