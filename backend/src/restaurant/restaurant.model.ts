import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MenuItem {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  price: number;
}

@ObjectType()
export class Restaurant {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  country: string;

  @Field(() => [MenuItem])
  menus: MenuItem[];
}


