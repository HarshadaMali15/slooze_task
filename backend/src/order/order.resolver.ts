import { Args, Field, ID, InputType, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Order } from './order.model';
import { OrderService } from './order.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResolveField, Parent } from '@nestjs/graphql';
@InputType()
class CreateOrderItemInput {
  @Field(() => Int)
  menuItemId: number;

  @Field(() => Int)
  quantity: number;
}

@Resolver(() => Order)
@UseGuards(RolesGuard)
export class OrderResolver {
  constructor(private orderService: OrderService) {}

  @Query(() => [Order])
  async myOrders(@CurrentUser() user: AuthUser) {
    return this.orderService.listMyOrders(user);
  }

  @Mutation(() => Order)
  async createOrder(
    @CurrentUser() user: AuthUser,
    @Args('restaurantId', { type: () => Int }) restaurantId: number,
    @Args({ name: 'items', type: () => [CreateOrderItemInput] })
    items: CreateOrderItemInput[],
  ) {
    return this.orderService.createOrder(user, restaurantId, items);
  }

  @Mutation(() => Order)
  async cancelOrder(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ) {
    return this.orderService.cancelOrder(user, orderId);
  }
  @ResolveField(() => String)
menuItemName(@Parent() item: any) {
  return item.menuItem?.name;
}

@ResolveField(() => Number)
menuItemPrice(@Parent() item: any) {
  return item.menuItem?.price;
}
}


