import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserInfo {
  @Field()
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field()
  country: string;
}

@ObjectType()
export class LoginResponse {
  @Field()
  token: string;

  @Field(() => UserInfo)
  user: UserInfo;
}


