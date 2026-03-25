import { Module } from '@nestjs/common';
import { CartResolver } from './cart.resolver';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [CartResolver, CartService, PrismaService],
  exports: [CartService],
})
export class CartModule {}
