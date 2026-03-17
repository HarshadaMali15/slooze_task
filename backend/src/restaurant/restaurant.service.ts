import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(user: AuthUser | null) {
    // Anonymous: return all restaurants (useful for quick testing)
    if (!user) {
      return this.prisma.restaurant.findMany({
        include: { menus: true },
      });
    }

    // Admin: can see all restaurants, all countries
    if (user.role === 'ADMIN') {
      return this.prisma.restaurant.findMany({
        include: { menus: true },
      });
    }

    // Manager / Member: restricted to their own country (ReBAC)
    return this.prisma.restaurant.findMany({
      where: { country: user.country as any },
      include: { menus: true },
    });
  }
}


