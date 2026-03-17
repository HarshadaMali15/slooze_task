import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthUser } from '../auth/current-user.decorator';
import { OrderStatus } from './order.model';

interface CreateOrderItemInput {
  menuItemId: number;
  quantity: number;
}

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async listMyOrders(user: AuthUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(
    user: AuthUser,
    restaurantId: number,
    items: CreateOrderItemInput[],
  ) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    // Ensure restaurant is in user's country (for non-admin)
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    if (user.role !== 'ADMIN' && restaurant.country !== user.country) {
      throw new ForbiddenException('Cannot order from another country');
    }

    // Basic total calculation could be added if needed
    return this.prisma.order.create({
      data: {
        userId: user.id,
        country: user.country as any,
        status: OrderStatus.PENDING,
        items: {
          create: await Promise.all(
            items.map(async (item) => {
              const menuItem = await this.prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
              });
              if (!menuItem) {
                throw new NotFoundException(
                  `Menu item ${item.menuItemId} not found`,
                );
              }
              if (menuItem.restaurantId !== restaurantId) {
                throw new ForbiddenException(
                  'Menu item does not belong to restaurant',
                );
              }
              return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
              };
            }),
          ),
        },
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });
  }

  private async ensureOrderAccess(user: AuthUser, orderId: number) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (user.role === 'ADMIN') {
      return order;
    }

    if (order.country !== user.country) {
      throw new ForbiddenException('Cannot operate on another country order');
    }

    if (order.userId !== user.id && user.role === 'MEMBER') {
      throw new ForbiddenException('Cannot operate on others orders');
    }

    return order;
  }

  async cancelOrder(user: AuthUser, orderId: number) {
    const order = await this.ensureOrderAccess(user, orderId);

    if (user.role === 'MEMBER') {
      throw new ForbiddenException('Members cannot cancel orders');
    }

    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Order cannot be cancelled');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });
  }
}


