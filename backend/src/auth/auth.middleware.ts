import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: any, _res: any, next: () => void) {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || 'slooze-secret',
        ) as { userId: number };
        const user = await this.prisma.user.findUnique({
          where: { id: payload.userId },
        });
        if (user) {
          req.user = {
            id: user.id,
            role: user.role,
            country: user.country,
          };
        }
      } catch {
        // ignore invalid tokens, treat as anonymous
      }
    }
    next();
  }
}


