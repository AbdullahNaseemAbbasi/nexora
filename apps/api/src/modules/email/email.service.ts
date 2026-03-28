import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>("SMTP_HOST");

    if (host) {
      // Use configured SMTP (production)
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>("SMTP_PORT", 587),
        auth: {
          user: this.config.get<string>("SMTP_USER"),
          pass: this.config.get<string>("SMTP_PASS"),
        },
      });
      this.fromAddress = this.config.get<string>("SMTP_FROM", "Nexora <noreply@nexora.app>");
    } else {
      // Dev mode: auto-create Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.fromAddress = `Nexora <${testAccount.user}>`;
      this.logger.log(`📧 Ethereal test account created: ${testAccount.user}`);
    }
  }

  async sendPasswordReset(to: string, name: string, token: string) {
    const resetUrl = `${this.config.get("FRONTEND_URL")}/reset-password?token=${token}`;

    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: "Reset your Nexora password",
      html: this.buildEmail({
        title: "Reset your password",
        greeting: `Hi ${name},`,
        body: "We received a request to reset your Nexora password. Click the button below to choose a new password. This link expires in 1 hour.",
        ctaLabel: "Reset Password",
        ctaUrl: resetUrl,
        footer: "If you didn't request a password reset, you can safely ignore this email.",
      }),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`📬 Password reset email preview: ${previewUrl}`);
    }
  }

  async sendEmailVerification(to: string, name: string, token: string) {
    const verifyUrl = `${this.config.get("FRONTEND_URL")}/verify-email?token=${token}`;

    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: "Verify your Nexora email address",
      html: this.buildEmail({
        title: "Verify your email",
        greeting: `Welcome to Nexora, ${name}!`,
        body: "Please verify your email address to get started. Click the button below.",
        ctaLabel: "Verify Email",
        ctaUrl: verifyUrl,
        footer: "If you didn't create a Nexora account, you can safely ignore this email.",
      }),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`📬 Verification email preview: ${previewUrl}`);
    }
  }

  async sendTaskAssigned(
    to: string,
    name: string,
    taskTitle: string,
    projectName: string,
    taskUrl: string,
  ) {
    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: `You've been assigned: ${taskTitle}`,
      html: this.buildEmail({
        title: "New task assigned to you",
        greeting: `Hi ${name},`,
        body: `You've been assigned a task in <strong>${projectName}</strong>:<br/><br/><strong>${taskTitle}</strong>`,
        ctaLabel: "View Task",
        ctaUrl: taskUrl,
        footer: "You can manage your notification preferences in Nexora settings.",
      }),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`📬 Task assigned email preview: ${previewUrl}`);
    }
  }

  private buildEmail({
    title,
    greeting,
    body,
    ctaLabel,
    ctaUrl,
    footer,
  }: {
    title: string;
    greeting: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
    footer: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #262626;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 36px;border-bottom:1px solid #262626;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:8px;">
                      <div style="width:28px;height:28px;background:#ffffff;border-radius:6px;display:inline-block;text-align:center;line-height:28px;">
                        <span style="font-size:12px;font-weight:700;color:#000;">N</span>
                      </div>
                      <span style="font-size:16px;font-weight:600;color:#ffffff;margin-left:8px;">Nexora</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:600;color:#ffffff;">${title}</h1>
              <p style="margin:0 0 16px 0;font-size:14px;color:#a1a1aa;">${greeting}</p>
              <p style="margin:0 0 28px 0;font-size:14px;color:#a1a1aa;line-height:1.6;">${body}</p>
              <a href="${ctaUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">${ctaLabel}</a>
              <p style="margin:28px 0 0 0;font-size:12px;color:#52525b;line-height:1.5;">
                Or copy this link:<br/>
                <a href="${ctaUrl}" style="color:#71717a;word-break:break-all;">${ctaUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:12px;color:#52525b;">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
