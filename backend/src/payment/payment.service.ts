import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthUser } from '../auth/current-user.decorator';
import { OrderStatus } from '../order/order.model';

@Injectable()
export class PaymentService {

  constructor(private prisma: PrismaService) {}



  async listMyPaymentMethods(user: AuthUser) {

    if (user.role === 'ADMIN') {
      return this.prisma.paymentMethod.findMany();
    }

    return this.prisma.paymentMethod.findMany({
      where: {
        userId: user.id,
      },
    });

  }



  async addPaymentMethod(
    user: AuthUser,
    brand: string,
    last4: string,
  ) {

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can add payment methods');
    }

    return this.prisma.paymentMethod.create({
      data: {
        userId: user.id,
        brand,
        last4,
        country: user.country as any,
      },
    });

  }



  async checkoutOrder(
    user: AuthUser,
    orderId: number,
    paymentMethodId: number,
  ) {

    if (user.role === 'MEMBER') {
      throw new ForbiddenException('Members cannot checkout orders');
    }



    const order = await this.prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }



    if (user.role !== 'ADMIN' && order.country !== user.country) {
      throw new ForbiddenException('Cannot checkout order from another country');
    }



    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: Number(paymentMethodId) },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    // Idempotency: each order can have at most one payment (Payment.orderId is unique).
    // If a payment already exists, ensure the order is PAID and return it.
    if (existingPayment) {
      if (order.status !== OrderStatus.PAID) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });
      }
      return existingPayment;
    }

    const amount = order.items.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0,
    );



    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        paymentMethodId: paymentMethod.id,
        amount,
      },
    });



    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });



    return payment;

  }

}