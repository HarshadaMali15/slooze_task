'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GET_ALL_SHARED_CARTS = gql`
  query GetAllSharedCarts {
    getAllSharedCarts {
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
        name
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

export default function AllGroupCartsPage() {
  const router = useRouter();
  const { data, loading, error } = useQuery<{ getAllSharedCarts: any[] }>(GET_ALL_SHARED_CARTS);
  const [createOrder] = useMutation<{ createOrder: { id: string, status: string, createdAt: string } }>(CREATE_ORDER);
  const [checkoutOrder] = useMutation(CHECKOUT_ORDER);
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
    
    // Only Admin can access this page
    if (userData.role !== 'ADMIN') {
      router.push('/restaurants');
      return;
    }
  }, [router]);

  const placeOrder = async (cart: any) => {
    if (!cart.items || cart.items.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      // Get restaurant ID based on user's country
      const restaurantId = userCountry === 'INDIA' ? 1 : 2; // 1 for India, 2 for America
      
      // Group items by their actual restaurant (based on menuItemId)
      const itemsByRestaurant = cart.items.reduce((acc: any, item: any) => {
        let restaurantId;
        
        // Determine restaurant based on menuItemId
        if ([1, 2].includes(item.menuItemId)) {
          restaurantId = 1; // Mumbai Spice House (INDIA)
        } else if ([5, 6].includes(item.menuItemId)) {
          restaurantId = 3; // Mumbai Spice House (INDIA)
        } else if ([3, 4].includes(item.menuItemId)) {
          restaurantId = 2; // New York Burger Co. (AMERICA)
        } else if ([7, 8].includes(item.menuItemId)) {
          restaurantId = 4; // New York Burger Co. (AMERICA)
        } else {
          // Default fallback based on user country
          restaurantId = userCountry === 'INDIA' ? 1 : 2;
        }
        
        if (!acc[restaurantId]) {
          acc[restaurantId] = [];
        }
        acc[restaurantId].push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        });
        return acc;
      }, {} as Record<number, Array<{ menuItemId: number; quantity: number }>>);

      console.log('Items grouped by restaurant:', itemsByRestaurant);

      // Create orders for each restaurant
      for (const [restaurantId, items] of Object.entries(itemsByRestaurant)) {
        console.log(`Creating order for restaurant ${restaurantId} with items:`, items);
        
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
      alert('Failed to place order: ' + (error as any).message);
    }
  };

  if (loading) return <p className="p-4">Loading all group carts…</p>;
  if (error) return <p className="p-4 text-red-600">Error loading carts</p>;

  console.log('=== ALL GROUP CARTS DEBUG ===');
  console.log('User Role:', userRole);
  console.log('User Country:', userCountry);
  console.log('All Shared Carts Data:', data);
  console.log('Carts Length:', data?.getAllSharedCarts?.length || 0);
  console.log('=== END DEBUG ===');

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">All Group Carts</h1>
          <p className="text-xs text-slate-500">All shared group carts from all users</p>
          <div className="text-xs text-slate-600 mt-1">
            <span className="font-semibold">Your Role:</span> {userRole} |{' '}
            <span className="font-semibold">Your Country:</span> {userCountry}
          </div>
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
            className="px-3 py-1 rounded-full border border-indigo-300 text-indigo-900 bg-indigo-50 hover:bg-indigo-100"
            onClick={() => router.push('/cart/all-individual')}
          >
            All Carts
          </button>
          <button
            className="px-3 py-1 rounded-full border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
            onClick={() => router.push('/payment-methods')}
          >
            Payment Methods
          </button>
          <button
            className="px-3 py-1 rounded-full border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/login');
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 p-4 bg-white/95 rounded-lg border">
            <h3 className="text-sm font-semibold text-slate-900">All Group Carts Info:</h3>
            <p className="text-xs text-slate-600">Your Role: {userRole}</p>
            <p className="text-xs text-slate-600">Your Country: {userCountry}</p>
            <p className="text-xs text-slate-600">Carts Found: {data?.getAllSharedCarts?.length || 0}</p>
            <p className="text-xs text-slate-600">Loading: {loading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-slate-600">Error: {error ? error.message : 'None'}</p>
          </div>
          
          {!data?.getAllSharedCarts || data.getAllSharedCarts.length === 0 ? (
            <div className="bg-white/95 rounded-2xl shadow-lg p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">No group carts found</h2>
              <p className="text-slate-600 mb-4">No users have created group carts yet</p>
              <button
                className="px-4 py-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600"
                onClick={() => router.push('/restaurants')}
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {data.getAllSharedCarts.map((cart: any) => {
                const totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                const totalAmount = cart.items.reduce((sum: number, item: any) => sum + (item.menuItemPrice * item.quantity), 0);
                const userName = cart.user?.name || cart.user?.email || `User ${cart.userId}`;
                const userRole = cart.user?.role || 'UNKNOWN';
                const userCountry = cart.user?.country || cart.country;

                return (
                  <div key={cart.id} className="bg-white/95 rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{userName}'s Group Cart</h2>
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
                        <p className="text-slate-500">This cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
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
                          className="w-full px-4 py-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 font-medium"
                          onClick={() => placeOrder(cart)}
                        >
                          Place Order for {userName}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
