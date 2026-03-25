import { Args, Field, ID, InputType, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Cart, CartItem } from './cart.model';
import { CartService } from './cart.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResolveField, Parent } from '@nestjs/graphql';

@InputType()
class AddToCartInput {
  @Field(() => Boolean)
  isShared: boolean;

  @Field(() => Int)
  menuItemId: number;

  @Field(() => Int)
  quantity: number;
}

@InputType()
class UpdateCartItemInput {
  @Field(() => Boolean)
  isShared: boolean;

  @Field(() => Int)
  cartItemId: number;

  @Field(() => Int)
  quantity: number;
}

@InputType()
class RemoveFromCartInput {
  @Field(() => Boolean)
  isShared: boolean;

  @Field(() => Int)
  cartItemId: number;
}

@Resolver(() => Cart)
@UseGuards(RolesGuard)
export class CartResolver {
  constructor(private cartService: CartService) {}

  @Query(() => Cart)
  async getIndividualCart(@CurrentUser() user: AuthUser) {
    return this.cartService.getOrCreateIndividualCart(user);
  }

  @Query(() => Cart)
  async getSharedCart(@CurrentUser() user: AuthUser) {
    return this.cartService.getOrCreateSharedCart(user);
  }

  @Query(() => [Cart])
  async getAllIndividualCarts(@CurrentUser() user: AuthUser) {
    return this.cartService.getAllIndividualCarts(user);
  }

  @Query(() => [Cart])
  async getCountryIndividualCarts(@CurrentUser() user: AuthUser) {
    return this.cartService.getCountryIndividualCarts(user);
  }

  @Query(() => [Cart])
  async getCountryGroupCarts(@CurrentUser() user: AuthUser) {
    return this.cartService.getCountryGroupCarts(user);
  }

  @Query(() => [Cart])
  async getAllSharedCarts(@CurrentUser() user: AuthUser) {
    return this.cartService.getAllSharedCarts(user);
  }

  @Mutation(() => Cart)
  async addToCart(
    @CurrentUser() user: AuthUser,
    @Args({ name: 'input', type: () => AddToCartInput })
    input: AddToCartInput,
  ) {
    return this.cartService.addToCart(
      user,
      input.isShared,
      input.menuItemId,
      input.quantity,
    );
  }

  @Mutation(() => Cart)
  async updateCartItemQuantity(
    @CurrentUser() user: AuthUser,
    @Args({ name: 'input', type: () => UpdateCartItemInput })
    input: UpdateCartItemInput,
  ) {
    return this.cartService.updateCartItemQuantity(
      user,
      input.isShared,
      input.cartItemId,
      input.quantity,
    );
  }

  @Mutation(() => Cart)
  async removeFromCart(
    @CurrentUser() user: AuthUser,
    @Args({ name: 'input', type: () => RemoveFromCartInput })
    input: RemoveFromCartInput,
  ) {
    return this.cartService.removeFromCart(
      user,
      input.isShared,
      input.cartItemId,
    );
  }

  @Mutation(() => Cart)
  async clearCart(
    @CurrentUser() user: AuthUser,
    @Args('isShared', { type: () => Boolean }) isShared: boolean,
  ) {
    return this.cartService.clearCart(user, isShared);
  }

  @ResolveField(() => String)
  menuItemName(@Parent() item: CartItem) {
    return item.menuItem?.name;
  }

  @ResolveField(() => Number)
  menuItemPrice(@Parent() item: CartItem) {
    return item.menuItem?.price;
  }
}
