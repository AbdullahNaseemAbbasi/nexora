import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.config.get<string>("STRIPE_SECRET_KEY") || "sk_test_placeholder", {
      apiVersion: "2026-03-25.dahlia",
    });
  }

  async getSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    return {
      plan: tenant?.plan || "FREE",
      status: sub?.status || "ACTIVE",
      currentPeriodEnd: sub?.currentPeriodEnd || null,
      stripeSubscriptionId: sub?.stripeSubscriptionId || null,
    };
  }

  async createCheckoutSession(tenantId: string, userId: string, plan: "PRO" | "ENTERPRISE") {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY") || "";
    if (!secretKey || secretKey === "sk_test_placeholder") {
      throw new BadRequestException(
        "Stripe is not configured. Add STRIPE_SECRET_KEY to .env to enable billing.",
      );
    }

    const priceId =
      plan === "PRO"
        ? this.config.get<string>("STRIPE_PRO_PRICE_ID")
        : this.config.get<string>("STRIPE_ENTERPRISE_PRICE_ID");

    if (!priceId) {
      throw new BadRequestException(`STRIPE_${plan}_PRICE_ID not configured in .env`);
    }

    // Get or create Stripe customer
    let sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    let customerId = sub?.stripeCustomerId;

    if (!customerId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      const customer = await this.stripe.customers.create({
        name: tenant?.name,
        metadata: { tenantId },
      });
      customerId = customer.id;

      // Upsert subscription record
      sub = await this.prisma.subscription.upsert({
        where: { tenantId },
        update: { stripeCustomerId: customerId },
        create: {
          tenantId,
          stripeCustomerId: customerId,
          plan: "FREE",
          status: "ACTIVE",
        },
      });
    }

    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${frontendUrl}/dashboard/settings?billing=success`,
      cancel_url: `${frontendUrl}/dashboard/settings?billing=cancelled`,
      metadata: { tenantId, plan },
    });

    return { url: session.url };
  }

  async createPortalSession(tenantId: string) {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY") || "";
    if (!secretKey || secretKey === "sk_test_placeholder") {
      throw new BadRequestException("Stripe is not configured.");
    }

    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException("No billing account found. Please subscribe first.");
    }

    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3000";
    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard/settings`,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET") || "";
    if (!webhookSecret || webhookSecret === "whsec_placeholder") return { received: true };

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException("Invalid webhook signature");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan as "PRO" | "ENTERPRISE";
        const stripeSubId = session.subscription as string;

        if (tenantId && plan) {
          await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { plan },
          });
          await this.prisma.subscription.upsert({
            where: { tenantId },
            update: { plan, stripeSubscriptionId: stripeSubId, status: "ACTIVE" },
            create: {
              tenantId,
              plan,
              stripeSubscriptionId: stripeSubId,
              stripeCustomerId: session.customer as string,
              status: "ACTIVE",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await this.prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (existing) {
          await this.prisma.tenant.update({
            where: { id: existing.tenantId },
            data: { plan: "FREE" },
          });
          await this.prisma.subscription.update({
            where: { id: existing.id },
            data: { plan: "FREE", status: "CANCELED" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const existing = await this.prisma.subscription.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (existing) {
          await this.prisma.subscription.update({
            where: { id: existing.id },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
    }

    return { received: true };
  }
}
