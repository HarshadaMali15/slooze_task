import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurant.resolver';
import { RestaurantService } from './restaurant.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [RestaurantResolver, RestaurantService, PrismaService],
})
export class RestaurantModule {}


