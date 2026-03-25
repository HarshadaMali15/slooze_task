'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// GraphQL query to get all individual carts (for Admin only)
const GET_ALL_INDIVIDUAL_CARTS = gql`
  query GetAllIndividualCarts {
    getAllIndividualCarts {
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
      user {
        id
        email
        role
        country
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

type User = {
  id: string;
  email: string;
  role: string;
  country: string;
};

type Cart = {
  id: number;
  country: string;
  isShared: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    menuItemId: number;
    quantity: number;
    menuItemName: string;
    menuItemPrice: number;
  }>;
  user?: User;
};

export default function AllIndividualCartsPage() {
  const router = useRouter();
  const { data: cartsData, loading: cartsLoading, error: cartsError } = useQuery<{ getAllIndividualCarts: Cart[] }>(GET_ALL_INDIVIDUAL_CARTS);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [createOrder] = useMutation<{ createOrder: { id: string, status: string, createdAt: string } }>(CREATE_ORDER);
  const [checkoutOrder] = useMutation(CHECKOUT_ORDER);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(stored);
    setUserRole(userData.role);
    
    // Only Admin can access this page
    if (userData.role !== 'ADMIN') {
      router.push('/cart/individual');
      return;
    }
  }, [router]);

  // Debug logging
  useEffect(() => {
    console.log('=== ALL CARTS DEBUG ===');
    console.log('User Role:', userRole);
    console.log('Loading:', cartsLoading);
    console.log('Error:', cartsError);
    console.log('Carts Data:', cartsData);
    console.log('Carts Length:', cartsData?.getAllIndividualCarts?.length || 0);
    
    // Debug each cart's user data
    cartsData?.getAllIndividualCarts?.forEach((cart, index) => {
      console.log(`Cart ${index + 1} User Data:`, cart.user);
      console.log(`Cart ${index + 1} Name:`, cart.user?.name);
      console.log(`Cart ${index + 1} Email:`, cart.user?.email);
    });
    
    console.log('=== END DEBUG ===');
  }, [userRole, cartsLoading, cartsError, cartsData]);

  const handlePlaceOrder = async (userId: string, cart: Cart) => {
    if (cart.items.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      // Group items by restaurant
      const itemsByRestaurant = cart.items.reduce((acc, item) => {
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
        }
      }

      alert('Order placed and paid successfully!');
      router.push('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
    }
  };

  if (userRole !== 'ADMIN') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-500 via-orange-400 to-amber-400">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-white text-lg">Access Denied</p>
            <p className="text-white text-sm mt-2">Only Admin can view all individual carts</p>
          </div>
        </div>
      </main>
    );
  }

  if (cartsLoading) return <p className="p-4">Loading carts…</p>;
  if (cartsError) return <p className="p-4 text-red-600">Error: {cartsError.message}</p>;

  console.log('=== RENDER DEBUG ===');
  console.log('Rendering carts:', cartsData?.getAllIndividualCarts);
  console.log('Number of carts to render:', cartsData?.getAllIndividualCarts?.length);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">All Individual Carts</h1>
          <p className="text-xs text-slate-500">View all users' individual carts</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            className="px-3 py-1 rounded-full border border-slate-300 text-slate-900 bg-white hover:bg-slate-100"
            onClick={() => router.push('/restaurants')}
          >
            Restaurants
          </button>
          <button
            className="px-3 py-1 rounded-full border border-blue-300 text-blue-900 bg-blue-50 hover:bg-blue-100"
            onClick={() => router.push('/cart/individual')}
          >
            My Cart
          </button>
          <button
            className="px-3 py-1 rounded-full border border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100"
            onClick={() => router.push('/cart/group')}
          >
            Group Cart
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 p-4 bg-white/95 rounded-lg border">
            <h3 className="text-sm font-semibold text-slate-900">Debug Info:</h3>
            <p className="text-xs text-slate-600">Carts Found: {cartsData?.getAllIndividualCarts?.length || 0}</p>
            <p className="text-xs text-slate-600">User Role: {userRole}</p>
            <p className="text-xs text-slate-600">Loading: {cartsLoading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-slate-600">Error: {cartsError ? cartsError.message : 'None'}</p>
          </div>
          <div className="grid gap-6">
            {cartsData?.getAllIndividualCarts.map((cart) => {
              const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
              const totalAmount = cart.items.reduce((sum, item) => sum + (item.menuItemPrice * item.quantity), 0);
              const userName = cart.user?.name || cart.user?.email || `User ${cart.userId}`;
              const userRole = cart.user?.role || 'UNKNOWN';
              const userCountry = cart.user?.country || cart.country;

              return (
                <div key={cart.id} className="bg-white/95 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{userName}</h2>
                      <p className="text-sm text-slate-600">
                        {userRole} • {userCountry}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <span className="font-semibold">Items:</span> {totalItems} |{' '}
                      <span className="font-semibold">Total:</span> ${totalAmount.toFixed(2)}
                    </div>
                  </div>

                  {cart.items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900">{item.menuItemName}</h3>
                            <p className="text-sm text-slate-600">${item.menuItemPrice} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Qty: {item.quantity}</span>
                            <span className="font-medium text-slate-900">
                              ${(item.menuItemPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.items.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <button
                        className="w-full px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 font-medium"
                        onClick={() => handlePlaceOrder(cart.userId.toString(), cart)}
                      >
                        Place Order for {userName}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
