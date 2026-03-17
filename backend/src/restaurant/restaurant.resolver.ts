import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Restaurant } from './restaurant.model';
import { RestaurantService } from './restaurant.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => Restaurant)
@UseGuards(RolesGuard)
export class RestaurantResolver {
  constructor(private restaurantService: RestaurantService) {}

  @Query(() => [Restaurant], { name: 'restaurants' })
  async getRestaurants(@CurrentUser() user: AuthUser | null) {
    return this.restaurantService.findAllForUser(user);
  }
}


