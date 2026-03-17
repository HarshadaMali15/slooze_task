import { Module } from '@nestjs/common';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [OrderResolver, OrderService, PrismaService],
})
export class OrderModule {}


