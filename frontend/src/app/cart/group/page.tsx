'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GET_SHARED_CART = gql`
  query GetSharedCart {
    getSharedCart {
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

const CLEAR_CART = gql`
  mutation ClearCart($isShared: Boolean!) {
    clearCart(isShared: $isShared) {
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

type CartItem = {
  restaurantId: number;
  restaurantName: string;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  userCountry?: string; // Country of user who added this item
  userEmail?: string; // Email of user who added this item
};

export default function GroupCartPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery<{ getSharedCart: any }>(GET_SHARED_CART);
  const [createOrder] = useMutation<{ createOrder: { id: string, status: string, createdAt: string } }>(CREATE_ORDER);
  const [checkoutOrder] = useMutation(CHECKOUT_ORDER);
  const [clearCart] = useMutation(CLEAR_CART);
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
    
    // Only Admin can access this page (for admin group cart)
    if (userData.role !== 'ADMIN') {
      router.push('/restaurants');
      return;
    }
  }, [router]);

  const placeOrder = async () => {
    if (!data?.getSharedCart?.items || data.getSharedCart.items.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      // Group items by their actual restaurant (based on menuItemId)
      // INDIA items: 1,2,5,6 → Restaurant 1 or 3
      // AMERICA items: 3,4,7,8 → Restaurant 2 or 4
      const itemsByRestaurant = data.getSharedCart.items.reduce((acc: any, item: any) => {
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

  const handleClearCart = async () => {
    try {
      await clearCart({
        variables: {
          isShared: true // Clear the shared (group) cart
        },
        refetchQueries: ['GetSharedCart'] // Refresh the cart data
      });
      alert('Cart cleared successfully!');
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart');
    }
  };

  if (loading) return <p className="p-4">Loading group cart…</p>;
  if (error) return <p className="p-4 text-red-600">Error loading cart</p>;

  const cartItems = data?.getSharedCart?.items || [];
  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.menuItemPrice * item.quantity), 0);

  console.log('=== GROUP CART DEBUG ===');
  console.log('User Role:', userRole);
  console.log('User Country:', userCountry);
  console.log('Cart Data:', data);
  console.log('Cart Items:', cartItems);
  console.log('Total Items:', totalItems);
  console.log('Total Amount:', totalAmount);
  console.log('=== END DEBUG ===');

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-400 to-rose-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-purple-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Group Cart</h1>
          <p className="text-xs text-slate-500">Your shared group cart</p>
          <div className="text-xs text-slate-600 mt-1">
            <span className="font-semibold">Items:</span> {totalItems} |{' '}
            <span className="font-semibold">Total:</span> ${totalAmount.toFixed(2)}
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
          {(userRole === 'MANAGER' || userRole === 'MEMBER') && (
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 p-4 bg-white/95 rounded-lg border">
            <h3 className="text-sm font-semibold text-slate-900">My Group Cart Info:</h3>
            <p className="text-xs text-slate-600">Your Role: {userRole}</p>
            <p className="text-xs text-slate-600">Your Country: {userCountry}</p>
            <p className="text-xs text-slate-600">Items: {totalItems}</p>
            <p className="text-xs text-slate-600">Total Amount: ${totalAmount.toFixed(2)}</p>
            <p className="text-xs text-slate-600">Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
          
          {cartItems.length === 0 ? (
            <div className="bg-white/95 rounded-2xl shadow-lg p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Your group cart is empty</h2>
              <p className="text-slate-600 mb-4">Add items from restaurants to see them here</p>
              <button
                className="px-4 py-2 rounded-full bg-purple-500 text-white hover:bg-purple-600"
                onClick={() => router.push('/restaurants')}
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="bg-white/95 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-900">My Group Order Summary</h2>
                <div className="flex gap-2">
                  <button
                    className="text-sm px-3 py-1 rounded-full border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </button>
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold">Items:</span> {totalItems} |{' '}
                    <span className="font-semibold">Total:</span> ${totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="bg-purple-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
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
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-slate-900">Total:</span>
                  <span className="text-lg font-bold text-purple-600">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>

                <button
                  className="w-full px-4 py-3 rounded-full bg-purple-500 text-white hover:bg-purple-600 font-medium"
                  onClick={placeOrder}
                >
                  Place Group Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
