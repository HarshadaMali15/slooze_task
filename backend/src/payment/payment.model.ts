import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentMethod {
  @Field(() => ID)
  id: number;

  @Field()
  brand: string;

  @Field()
  last4: string;

  @Field()
  country: string;
}

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  orderId: number;

  @Field(() => ID)
  paymentMethodId: number;

  @Field()
  amount: number;

  @Field()
  createdAt: Date;
}


