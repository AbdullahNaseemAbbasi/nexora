import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException("User with this email already exists");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, firstName: dto.firstName, lastName: dto.lastName, emailVerifyToken },
    });

    this.emailService.sendEmailVerification(user.email, user.firstName, emailVerifyToken).catch(() => null);

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException("Invalid email or password");

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException("Invalid email or password");

    // Fetch tokens and tenants in parallel — one less round-trip from the client
    const [tokens, tenants] = await Promise.all([
      this.generateTokens(user.id, user.email),
      this.prisma.tenant.findMany({
        where: { members: { some: { userId: user.id } } },
        include: { _count: { select: { members: true, projects: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified },
      tenants,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException("Invalid refresh token");
      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, emailVerified: true, isSuperAdmin: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException("User not found");
    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return { message: "If that email is registered, you will receive a reset link shortly." };

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpiry: expiry },
    });

    this.emailService.sendPasswordReset(user.email, user.firstName, token).catch(() => null);
    return { message: "If that email is registered, you will receive a reset link shortly." };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: dto.token, resetPasswordExpiry: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException("Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetPasswordToken: null, resetPasswordExpiry: null },
    });
    return { message: "Password reset successfully. You can now log in." };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) throw new NotFoundException("Invalid verification token");
    if (user.emailVerified) return { message: "Email already verified." };

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });
    return { message: "Email verified successfully!" };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.emailVerified) throw new BadRequestException("Email is already verified");

    const token = crypto.randomBytes(32).toString("hex");
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerifyToken: token } });
    this.emailService.sendEmailVerification(user.email, user.firstName, token).catch(() => null);
    return { message: "Verification email sent." };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRY", "7d"),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
