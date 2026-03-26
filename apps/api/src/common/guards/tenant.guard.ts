import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const tenantId = request.headers["x-tenant-id"];

    if (!tenantId) {
      throw new ForbiddenException("x-tenant-id header is required");
    }

    const membership = await this.prisma.tenantMember.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    // Attach to request for downstream use
    request.tenantId = tenantId;
    request.memberRole = membership.role;

    return true;
  }
}
