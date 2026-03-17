import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class OrderItem {

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
export class Order {

  @Field(() => ID)
  id: number;

  @Field(() => ID)
  userId: number;

  @Field()
  country: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field()
  createdAt: Date;

  @Field(() => [OrderItem])
  items: OrderItem[];
}