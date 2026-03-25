'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GET_COUNTRY_GROUP_CARTS = gql`
  query GetCountryGroupCarts {
    getCountryGroupCarts {
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

export default function CountryGroupCartPage() {
  const router = useRouter();
  const { data: countryCartsData, loading: cartsLoading, error: cartsError } = useQuery<{ getCountryGroupCarts: any[] }>(GET_COUNTRY_GROUP_CARTS);
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
    
    // Only Managers and Members can access this page
    if (userData.role === 'ADMIN') {
      router.push('/cart/group'); // Admin should go to regular group cart
      return;
    }
  }, [router]);

  const placeOrder = async (cart: any) => {
    if (!cart.items || cart.items.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      // Group items by restaurant and create orders
      const itemsByRestaurant = cart.items.reduce((acc: any, item: any) => {
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

  if (userRole === 'ADMIN') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-500 via-orange-400 to-amber-400">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-white text-lg">Redirecting to Admin Group Cart...</p>
          </div>
        </div>
      </main>
    );
  }

  if (cartsLoading) return <p className="p-4">Loading country group carts…</p>;
  if (cartsError) return <p className="p-4 text-red-600">Error: {cartsError.message}</p>;

  console.log('=== COUNTRY GROUP CARTS DEBUG ===');
  console.log('User Role:', userRole);
  console.log('User Country:', userCountry);
  console.log('Country Carts Data:', countryCartsData);
  console.log('Carts Length:', countryCartsData?.getCountryGroupCarts?.length || 0);
  console.log('=== END DEBUG ===');

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-400 to-sky-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Country Group Carts</h1>
          <p className="text-xs text-slate-500">All group carts from users in {userCountry}</p>
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
          {(userRole === 'MANAGER' || userRole === 'MEMBER') && (
            <button
              className="px-3 py-1 rounded-full border border-green-300 text-green-900 bg-green-50 hover:bg-green-100"
              onClick={() => router.push('/cart/country-individual')}
            >
              Country Carts
            </button>
          )}
          <button
            className="px-3 py-1 rounded-full border border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100"
            onClick={() => router.push('/cart/group')}
          >
            My Group Cart
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 p-4 bg-white/95 rounded-lg border">
            <h3 className="text-sm font-semibold text-slate-900">Country Group Carts Info:</h3>
            <p className="text-xs text-slate-600">Your Country: {userCountry}</p>
            <p className="text-xs text-slate-600">Your Role: {userRole}</p>
            <p className="text-xs text-slate-600">Carts Found: {countryCartsData?.getCountryGroupCarts?.length || 0}</p>
            <p className="text-xs text-slate-600">Loading: {cartsLoading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-slate-600">Error: {cartsError ? cartsError.message : 'None'}</p>
          </div>
          
          {!countryCartsData?.getCountryGroupCarts || countryCartsData.getCountryGroupCarts.length === 0 ? (
            <div className="bg-white/95 rounded-2xl shadow-lg p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">No group carts found in {userCountry}</h2>
              <p className="text-slate-600 mb-4">Users in your country haven't created any group carts yet</p>
              <button
                className="px-4 py-2 rounded-full bg-teal-500 text-white hover:bg-teal-600"
                onClick={() => router.push('/restaurants')}
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {countryCartsData.getCountryGroupCarts.map((cart: any) => {
                const totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                const totalAmount = cart.items.reduce((sum: number, item: any) => sum + (item.menuItemPrice * item.quantity), 0);
                const userName = cart.user?.name || cart.user?.email || `User ${cart.userId}`;
                const userRole = cart.user?.role || 'UNKNOWN';
                const userCountry = cart.user?.country || cart.country;

                return (
                  <div key={cart.id} className="bg-white/95 rounded-2xl shadow-lg p-6 border-2 border-teal-200">
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
                          <div key={item.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
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
