import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface AuthUser {
  id: number;
  role: string;
  country: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | null => {
    // For HTTP routes
    if (ctx.getType() === 'http') {
      const request = ctx.switchToHttp().getRequest();
      return request.user ?? null;
    }

    // For GraphQL resolvers
    if (ctx.getType<'graphql'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(ctx);
      const request = gqlCtx.getContext<{ req?: { user?: AuthUser } }>().req;
      return request?.user ?? null;
    }

    return null;
  },
);
