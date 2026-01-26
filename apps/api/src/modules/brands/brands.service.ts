import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, dto: any) {
    const existing = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (existing) throw new ForbiddenException('Ya tienes un perfil de marca');
    
    return this.prisma.brandProfile.create({
      data: { userId, ...dto },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.brandProfile.findUnique({
      where: { userId },
      include: { campaigns: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile;
  }

  async updateProfile(userId: string, dto: any) {
    return this.prisma.brandProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
