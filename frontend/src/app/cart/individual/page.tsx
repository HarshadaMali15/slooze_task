'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// TypeScript types for GraphQL responses
interface CartItem {
  id: number;
  menuItemId: number;
  quantity: number;
  menuItemName: string;
  menuItemPrice: number;
}

interface Cart {
  id: number;
  country: string;
  isShared: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

interface CreateOrderResponse {
  createOrder: {
    id: number;
    status: string;
    createdAt: string;
  };
}

interface CheckoutOrderResponse {
  checkoutOrder: {
    id: number;
    amount: number;
    createdAt: string;
  };
}

const GET_INDIVIDUAL_CART = gql`
  query GetIndividualCart {
    getIndividualCart {
      id
      country
      isShared
      userId
      createdAt
      updatedAt
      items {
        id
        menuItemId
        quantity
        menuItemName
        menuItemPrice
      }
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      id
      country
      isShared
      userId
      createdAt
      updatedAt
      items {
        id
        menuItemId
        quantity
        menuItemName
        menuItemPrice
      }
    }
  }
`;

const UPDATE_CART_ITEM_QUANTITY = gql`
  mutation UpdateCartItemQuantity($input: UpdateCartItemInput!) {
    updateCartItemQuantity(input: $input) {
      id
      country
      isShared
      userId
      createdAt
      updatedAt
      items {
        id
        menuItemId
        quantity
        menuItemName
        menuItemPrice
      }
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($input: RemoveFromCartInput!) {
    removeFromCart(input: $input) {
      id
      country
      isShared
      userId
      createdAt
      updatedAt
      items {
        id
        menuItemId
        quantity
        menuItemName
        menuItemPrice
      }
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($restaurantId: Int!, $items: [CreateOrderItemInput!]!) {
    createOrder(restaurantId: $restaurantId, items: $items) {
      id
      status
      createdAt
    }
  }
`;

const CHECKOUT_ORDER = gql`
  mutation CheckoutOrder($orderId: ID!, $paymentMethodId: ID!) {
    checkoutOrder(orderId: $orderId, paymentMethodId: $paymentMethodId) {
      id
      amount
      createdAt
    }
  }
`;

export default function IndividualCartPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery<{ getIndividualCart: Cart }>(GET_INDIVIDUAL_CART, {
  fetchPolicy: 'network-only',
});
  const [addToCart] = useMutation(ADD_TO_CART);
  const [updateCartItemQuantity] = useMutation(UPDATE_CART_ITEM_QUANTITY);
  const [removeFromCart] = useMutation(REMOVE_FROM_CART);
  const [createOrder] = useMutation<CreateOrderResponse>(CREATE_ORDER);
  const [checkoutOrder] = useMutation<CheckoutOrderResponse>(CHECKOUT_ORDER);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(stored);
    setUserRole(userData.role);
    setUserCountry(userData.country);
  }, [router]);

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart({
        variables: {
          input: {
            isShared: false,
            cartItemId,
          },
        },
      });
    } else {
      await updateCartItemQuantity({
        variables: {
          input: {
            isShared: false,
            cartItemId,
            quantity: newQuantity,
          },
        },
      });
    }
    refetch();
  };

  const handleRemoveItem = async (cartItemId: number) => {
    await removeFromCart({
      variables: {
        input: {
          isShared: false,
          cartItemId,
        },
      },
    });
    refetch();
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      // Group items by restaurant and create orders
      const itemsByRestaurant = cartItems.reduce((acc, item) => {
        if (!acc[1]) { // Assuming restaurantId 1 for now
          acc[1] = [];
        }
        acc[1].push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        });
        return acc;
      }, {} as Record<number, Array<{ menuItemId: number; quantity: number }>>);

      // Create orders for each restaurant
      const orderIds = [];
      for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
        const result = await createOrder({
          variables: {
            restaurantId: parseInt(restaurantId),
            items,
          },
        });

        if (result.data?.createOrder) {
          await checkoutOrder({
            variables: {
              orderId: result.data.createOrder.id,
              paymentMethodId: 1,
            },
          });
          orderIds.push(result.data.createOrder.id);
        }
      }

      // Clear the cart after successful orders
      for (const item of cartItems) {
        await removeFromCart({
          variables: {
            input: {
              isShared: false,
              cartItemId: item.id,
            },
          },
        });
      }

      alert('Orders placed and paid successfully!');
      refetch();
      router.push('/orders');
    } catch (error) {
      console.error('Error placing orders:', error);
      alert('Failed to place orders');
    }
  };

  if (loading) return <p className="p-4">Loading cart…</p>;
  if (error) return <p className="p-4 text-red-600">{error.message}</p>;

  // Access control: Check if user can view this cart
  // Individual carts are always for the current user, except Admin who can see all
  // The backend getIndividualCart always returns the current user's cart
  // So no access control needed for individual carts - they always see their own cart

  const cartItems = data?.getIndividualCart?.items || [];
  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.menuItemPrice * item.quantity), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Individual Cart</h1>
          <p className="text-xs text-slate-500">Your personal cart items</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            className="px-3 py-1 rounded-full border border-slate-300 text-slate-900 bg-white hover:bg-slate-100"
            onClick={() => router.push('/restaurants')}
          >
            Restaurants
          </button>
          {userRole === 'ADMIN' && (
            <button
              className="px-3 py-1 rounded-full border border-indigo-300 text-indigo-900 bg-indigo-50 hover:bg-indigo-100"
              onClick={() => router.push('/cart/all-individual')}
            >
              All Carts
            </button>
          )}
          {(userRole === 'MANAGER' || userRole === 'MEMBER') && (
            <button
              className="px-3 py-1 rounded-full border border-green-300 text-green-900 bg-green-50 hover:bg-green-100"
              onClick={() => router.push('/cart/country-individual')}
            >
              Country Carts
            </button>
          )}
          {userRole === 'ADMIN' ? (
            <button
              className="px-3 py-1 rounded-full border border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100"
              onClick={() => router.push('/cart/group')}
            >
              Group Cart
            </button>
          ) : (
            <button
              className="px-3 py-1 rounded-full border border-teal-300 text-teal-900 bg-teal-50 hover:bg-teal-100"
              onClick={() => router.push('/cart/country-group')}
            >
              Country Group Cart
            </button>
          )}
        </div>
      </header>

      <div className="p-6">
        {cartItems.length === 0 ? (
          <div className="bg-white/95 rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-600 mb-4">Add items from the restaurant page to see them here</p>
            <button
              className="px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => router.push('/restaurants')}
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/95 rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Cart Items</h2>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold">Total Items:</span> {totalItems} |{' '}
                  <span className="font-semibold"> Total Amount:</span> ${totalAmount.toFixed(2)}
                </div>
              </div>

              <div className="space-y-3">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{item.menuItemName}</h3>
                      <p className="text-sm text-slate-600">${item.menuItemPrice} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Quantity:</span>
                      <span className="font-medium px-2 text-black">{item.quantity}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        ${(item.menuItemPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-slate-900">Total Amount:</span>
                <span className="text-lg font-bold text-blue-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                className="w-full px-4 py-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 font-medium"
                onClick={handlePlaceOrder}
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
