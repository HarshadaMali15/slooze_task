import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Cart, CartItem } from './cart.model';
import { Country } from '@prisma/client';
import type { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateIndividualCart(user: AuthUser): Promise<Cart> {
    let cart = await this.prisma.cart.findFirst({
      where: {
        userId: user.id,
        isShared: false,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: user.id,
          country: user.country as Country,
          isShared: false,
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
    }

    return this.formatCart(cart);
  }

  async getOrCreateSharedCart(user: AuthUser): Promise<Cart> {
    // First, clean up any shared carts without userId (delete items first, then carts)
    const cartsToDelete = await this.prisma.cart.findMany({
      where: {
        isShared: true,
        userId: null,
      },
    });

    for (const cart of cartsToDelete) {
      // Delete items first
      await this.prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
      // Then delete the cart
      await this.prisma.cart.delete({
        where: {
          id: cart.id,
        },
      });
    }

    let cart = await this.prisma.cart.findFirst({
      where: {
        userId: user.id, // Filter by current user's ID
        isShared: true,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: user.id, // Assign to current user
          country: user.country as Country,
          isShared: true,
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
    }

    return this.formatCart(cart);
  }

  async addToCart(
    user: AuthUser,
    isShared: boolean,
    menuItemId: number,
    quantity: number
  ): Promise<Cart> {
    const cart = isShared 
      ? await this.getOrCreateSharedCart(user)
      : await this.getOrCreateIndividualCart(user);

    const existingItem = cart.items.find(item => item.menuItemId === menuItemId);

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          quantity,
        },
      });
    }

    return isShared 
      ? await this.getOrCreateSharedCart(user)
      : await this.getOrCreateIndividualCart(user);
  }

  async updateCartItemQuantity(
    user: AuthUser,
    isShared: boolean,
    cartItemId: number,
    quantity: number
  ): Promise<Cart> {
    if (quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    }

    return isShared 
      ? await this.getOrCreateSharedCart(user)
      : await this.getOrCreateIndividualCart(user);
  }

  async removeFromCart(
    user: AuthUser,
    isShared: boolean,
    cartItemId: number
  ): Promise<Cart> {
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return isShared 
      ? await this.getOrCreateSharedCart(user)
      : await this.getOrCreateIndividualCart(user);
  }

  async clearCart(user: AuthUser, isShared: boolean): Promise<Cart> {
    const cart = isShared 
      ? await this.getOrCreateSharedCart(user)
      : await this.getOrCreateIndividualCart(user);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return isShared 
      ? await this.getOrCreateSharedCart(user)
      : await this.getOrCreateIndividualCart(user);
  }

  async getAllIndividualCarts(user: AuthUser): Promise<Cart[]> {
    // Only Admin can access all individual carts
    if (user.role !== 'ADMIN') {
      throw new Error('Access denied: Only Admin can view all individual carts');
    }

    const carts = await this.prisma.cart.findMany({
      where: {
        isShared: false,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            country: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return carts.map(cart => this.formatCart(cart));
  }

  async getCountryIndividualCarts(user: AuthUser): Promise<Cart[]> {
    // Only Managers and Members can access country individual carts
    if (user.role === 'ADMIN') {
      throw new Error('Access denied: Admin should use getAllIndividualCarts');
    }

    const carts = await this.prisma.cart.findMany({
      where: {
        isShared: false,
        country: user.country as Country, // Only carts from user's country
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            country: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return carts.map(cart => this.formatCart(cart));
  }

  async getCountryGroupCarts(user: AuthUser): Promise<Cart[]> {
    // Only Managers and Members can access country group carts
    if (user.role === 'ADMIN') {
      throw new Error('Access denied: Admin should use regular group cart');
    }

    // Get all shared carts from the same country
    const carts = await this.prisma.cart.findMany({
      where: {
        isShared: true,
        country: user.country as Country, // Only carts from user's country
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            country: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return carts.map(cart => this.formatCart(cart));
  }

  async getAllSharedCarts(user: AuthUser): Promise<Cart[]> {
    // Get all shared carts (for regular Group Cart page)
    // Admin can see all shared carts, Managers/Members see all shared carts without country restriction
    const carts = await this.prisma.cart.findMany({
      where: {
        isShared: true, // Only shared carts
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            country: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return carts.map(cart => this.formatCart(cart));
  }

  private formatCart(cart: any): Cart {
    return {
      id: cart.id,
      country: cart.country,
      isShared: cart.isShared,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        menuItemName: item.menuItem?.name,
        menuItemPrice: item.menuItem?.price,
        menuItem: item.menuItem,
      })),
    };
  }
}
