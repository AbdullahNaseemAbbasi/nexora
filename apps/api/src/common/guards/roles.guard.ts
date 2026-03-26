import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const tenantId = request.headers["x-tenant-id"];

    if (!userId || !tenantId) {
      return false;
    }

    const membership = await this.prisma.tenantMember.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });

    if (!membership) {
      return false;
    }

    // Attach tenant info to request
    request.tenantId = tenantId;
    request.memberRole = membership.role;

    return requiredRoles.includes(membership.role);
  }
}
