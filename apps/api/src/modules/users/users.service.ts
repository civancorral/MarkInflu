import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { UserRole, AccountStatus } from '@markinflu/database';
import { hash, compare } from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findById(id: string) {
    // Try cache first
    const cached = await this.redisService.getJson(`user:${id}`);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        brandProfile: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
          },
        },
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        agencyProfile: {
          select: {
            id: true,
            agencyName: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Cache for 5 minutes
    await this.redisService.setJson(`user:${id}`, user, 300);

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async updateProfile(userId: string, data: { email?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Invalidate cache
    await this.redisService.del(`user:${userId}`);

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ForbiddenException('Contraseña actual incorrecta');
    }

    const passwordHash = await hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deactivateAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: AccountStatus.DEACTIVATED },
    });

    // Invalidate cache and sessions
    await this.redisService.del(`user:${userId}`);
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  // Admin functions
  async findAll(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    status?: AccountStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, status, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { creatorProfile: { displayName: { contains: search, mode: 'insensitive' } } },
        { brandProfile: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          brandProfile: { select: { companyName: true } },
          creatorProfile: { select: { displayName: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(userId: string, status: AccountStatus) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await this.redisService.del(`user:${userId}`);

    if (status === 'SUSPENDED' || status === 'DEACTIVATED') {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }
  }
}
