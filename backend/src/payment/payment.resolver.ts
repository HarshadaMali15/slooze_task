import { Args, Float, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Payment, PaymentMethod } from './payment.model';
import { PaymentService } from './payment.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Resolver()
@UseGuards(RolesGuard)
export class PaymentResolver {
  constructor(private paymentService: PaymentService) {}

  @Query(() => [PaymentMethod])
  async myPaymentMethods(@CurrentUser() user: AuthUser) {
    return this.paymentService.listMyPaymentMethods(user);
  }

  @Mutation(() => PaymentMethod)
  async addPaymentMethod(
    @CurrentUser() user: AuthUser,
    @Args('brand') brand: string,
    @Args('last4') last4: string,
  ) {
    return this.paymentService.addPaymentMethod(user, brand, last4);
  }

  @Mutation(() => Payment)
  async checkoutOrder(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => ID }) orderId: number,
    @Args('paymentMethodId', { type: () => ID }) paymentMethodId: number,
  ) {
    return this.paymentService.checkoutOrder(user, orderId, paymentMethodId);
  }
}


