import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash, compare } from 'bcryptjs';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { EmailService } from '@/common/email/email.service';
import { UserRole, AccountStatus } from '@markinflu/database';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    brandProfileId?: string;
    creatorProfileId?: string;
    agencyProfileId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  // ============================================
  // REGISTER
  // ============================================

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    // Validate password
    if (dto.password.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }

    // Hash password
    const passwordHash = await hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role,
        status: AccountStatus.PENDING_VERIFICATION,
      },
    });

    await this.emailService.sendVerificationEmail(user.email, user.id);

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  // ============================================
  // LOGIN
  // ============================================

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        brandProfile: { select: { id: true } },
        creatorProfile: { select: { id: true } },
        agencyProfile: { select: { id: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida');
    }

    if (user.status === AccountStatus.DEACTIVATED) {
      throw new UnauthorizedException('Tu cuenta ha sido desactivada');
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    await this.createSession(user.id, ipAddress, userAgent);

    return this.generateAuthResponse(user);
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken } = dto;

    // Verify refresh token
    const payload = await this.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Token de refresco inválido');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.redisService.sismember(
      `blacklisted_tokens:${payload.sub}`,
      refreshToken,
    );

    if (isBlacklisted) {
      throw new UnauthorizedException('Token de refresco revocado');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        brandProfile: { select: { id: true } },
        creatorProfile: { select: { id: true } },
        agencyProfile: { select: { id: true } },
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Blacklist old refresh token
    await this.redisService.sadd(`blacklisted_tokens:${user.id}`, refreshToken);
    await this.redisService.expire(`blacklisted_tokens:${user.id}`, 60 * 60 * 24 * 30); // 30 days

    return this.generateAuthResponse(user);
  }

  // ============================================
  // LOGOUT
  // ============================================

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Blacklist refresh token if provided
    if (refreshToken) {
      await this.redisService.sadd(`blacklisted_tokens:${userId}`, refreshToken);
      await this.redisService.expire(`blacklisted_tokens:${userId}`, 60 * 60 * 24 * 30);
    }

    // Delete all sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Clear user cache
    await this.redisService.del(`user:${userId}`);
  }

  // ============================================
  // VERIFY EMAIL
  // ============================================

  async verifyEmail(token: string): Promise<void> {
    // Get verification data from Redis
    const userId = await this.redisService.get(`email_verification:${token}`);

    if (!userId) {
      throw new BadRequestException('Token de verificación inválido o expirado');
    }

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: AccountStatus.ACTIVE,
        emailVerified: new Date(),
      },
    });

    // Delete token from Redis
    await this.redisService.del(`email_verification:${token}`);
  }

  // ============================================
  // FORGOT PASSWORD
  // ============================================

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists
    if (!user) return;

    // Generate reset token
    const resetToken = uuidv4();

    // Store in Redis with 1 hour expiration
    await this.redisService.set(
      `password_reset:${resetToken}`,
      user.id,
      60 * 60, // 1 hour
    );

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  // ============================================
  // RESET PASSWORD
  // ============================================

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redisService.get(`password_reset:${token}`);

    if (!userId) {
      throw new BadRequestException('Token de restablecimiento inválido o expirado');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }

    const passwordHash = await hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete reset token
    await this.redisService.del(`password_reset:${token}`);

    // Invalidate all sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private async generateAuthResponse(user: any): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        brandProfileId: user.brandProfile?.id,
        creatorProfileId: user.creatorProfile?.id,
        agencyProfileId: user.agencyProfile?.id,
      },
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  private async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.session.create({
      data: {
        userId,
        token: uuidv4(),
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Clean up old sessions (keep only last 5)
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 5,
    });

    if (sessions.length > 0) {
      await this.prisma.session.deleteMany({
        where: { id: { in: sessions.map((s) => s.id) } },
      });
    }
  }

  async validateUser(userId: string): Promise<any> {
    // Try cache first
    const cached = await this.redisService.getJson(`user:${userId}`);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brandProfile: { select: { id: true } },
        creatorProfile: { select: { id: true } },
        agencyProfile: { select: { id: true } },
      },
    });

    if (!user) return null;

    const { passwordHash, ...safeUser } = user;

    // Cache for 5 minutes
    await this.redisService.setJson(`user:${userId}`, safeUser, 300);

    return safeUser;
  }
}
