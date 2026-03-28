import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { BillingService } from "./billing.service";

@ApiTags("Billing")
@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Webhook — no auth, raw body needed
  @Post("webhook")
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody!, signature);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get("subscription")
  getSubscription(@CurrentTenant() tenantId: string) {
    return this.billingService.getSubscription(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post("checkout")
  createCheckout(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Body("plan") plan: "PRO" | "ENTERPRISE",
  ) {
    return this.billingService.createCheckoutSession(tenantId, userId, plan);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post("portal")
  createPortal(@CurrentTenant() tenantId: string) {
    return this.billingService.createPortalSession(tenantId);
  }
}
