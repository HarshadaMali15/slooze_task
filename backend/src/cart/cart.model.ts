import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Country } from '@prisma/client';
import { UserInfo } from '../auth/auth.model';

@ObjectType()
export class CartItem {

  @Field()
  id: number

  @Field()
  menuItemId: number

  @Field()
  quantity: number

  @Field({ nullable: true })
  menuItemName?: string

  @Field({ nullable: true })
  menuItemPrice?: number

  menuItem: any
}

@ObjectType()
export class Cart {

  @Field(() => ID)
  id: number;

  @Field()
  country: string;

  @Field()
  isShared: boolean;

  @Field({ nullable: true })
  userId?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [CartItem])
  items: CartItem[];

  @Field({ nullable: true })
  user?: UserInfo;
}
