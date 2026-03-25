'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const RESTAURANTS = gql`
  query Restaurants {
    restaurants {
      id
      name
      country
      menus {
        id
        name
        price
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

type CartItem = { restaurantId: number; menuItemId: number; name: string; quantity: number };

type RestaurantsQueryData = {
  restaurants: Array<{
    id: string;
    name: string;
    country: string;
    menus: Array<{ id: string; name: string; price: number }>;
  }>;
};

type CreateOrderMutationData = {
  createOrder: { id: string; status: string };
};

export default function RestaurantsPage() {
  const router = useRouter();
  const { data, loading, error } = useQuery<RestaurantsQueryData>(RESTAURANTS, {
    // Always hit the backend so results reflect the current logged-in user/role/country
    fetchPolicy: 'network-only',
  });
  const [addToCart] = useMutation(ADD_TO_CART);
  const [createOrder] = useMutation<CreateOrderMutationData>(CREATE_ORDER);
  const [checkoutOrder] = useMutation(CHECKOUT_ORDER);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    restaurantId: number;
    restaurantName: string;
    menuItemId: number;
    name: string;
    price: number;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);

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

  const addToLocalCart = (restaurantId: number, menuItemId: number, name: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.restaurantId === restaurantId && i.menuItemId === menuItemId,
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { restaurantId, menuItemId, name, quantity: 1 }];
    });
  };

  const addToIndividualCart = (restaurantId: number, menuItemId: number, name: string, price: number) => {
    const restaurantName = data?.restaurants.find(r => r.id === restaurantId.toString())?.name || '';
    setSelectedItem({
      restaurantId,
      restaurantName,
      menuItemId,
      name,
      price
    });
    setShowSingleModal(true);
  };

  const addToGroupCart = async (restaurantId: number, menuItemId: number, name: string, price: number) => {
    console.log('=== RESTAURANTS PAGE DEBUG ===');
    console.log('Adding to group cart:', { restaurantId, menuItemId, name, price });
    
    try {
      // Use backend mutation to add to shared cart
      await addToCart({
        variables: {
          input: {
            isShared: true, // This makes it a group cart item
            menuItemId: menuItemId,
            quantity: 1
          }
        },
        refetchQueries: ['GetSharedCart'] // Refresh the group cart data
      });
      
      console.log('Item added to backend group cart successfully!');
      alert('Item added to group cart!');
    } catch (error) {
      console.error('Error adding to group cart:', error);
      alert('Failed to add to group cart');
    }
    
    console.log('=== END DEBUG ===');
  };

  const placeOrder = async () => {
    if (!cart.length) return;
    const restaurantId = cart[0].restaurantId;
    const items = cart.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
    }));
    await createOrder({ variables: { restaurantId, items } });
    setCart([]);
    alert('Order created!');
    router.push('/orders');
  };

  const handleAddToCart = async () => {
    if (!selectedItem) return;
    try {
      await addToCart({
        variables: {
          input: {
            isShared: false,
            menuItemId: selectedItem.menuItemId,
            quantity
          }
        },
        refetchQueries: ['GetIndividualCart']
      });
      setShowSingleModal(false);
      setQuantity(1);
      setSelectedItem(null);
      alert('Item added to individual cart successfully!');
      setTimeout(() => {
        router.push('/cart/individual');
      }, 500);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedItem) return;
    try {
      const result = await createOrder({
        variables: {
          restaurantId: selectedItem.restaurantId,
          items: [{
            menuItemId: selectedItem.menuItemId,
            quantity
          }]
        }
      });
      
      if (!result.data) {
        throw new Error('Failed to create order');
      }
      
      await checkoutOrder({
        variables: {
          orderId: result.data.createOrder.id,
          paymentMethodId: 1
        }
      });
      
      setShowSingleModal(false);
      setQuantity(1);
      setSelectedItem(null);
      alert('Order placed and paid successfully!');
      router.push('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to place order');
    }
  };

  if (loading) return <p className="p-4">Loading…</p>;
  if (error) return <p className="p-4 text-red-600">{error.message}</p>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Restaurants</h1>
          <p className="text-xs text-slate-500">
            Browse restaurants and add dishes to your cart. Access is filtered by your role & country.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            className="px-3 py-1 rounded-full border border-slate-300 text-slate-900 bg-white hover:bg-slate-100"
            onClick={() => router.push('/orders')}
          >
            My Orders
          </button>
          <button
            className="px-3 py-1 rounded-full border border-blue-300 text-blue-900 bg-blue-50 hover:bg-blue-100"
            onClick={() => router.push('/cart/individual')}
          >
            Single Cart
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
            <>
              <button
                className="px-3 py-1 rounded-full border border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100"
                onClick={() => router.push('/cart/group')}
              >
                Group Cart
              </button>
              <button
                className="px-3 py-1 rounded-full border border-indigo-300 text-indigo-900 bg-indigo-50 hover:bg-indigo-100"
                onClick={() => router.push('/cart/all-group-carts')}
              >
                All Group Carts
              </button>
            </>
          ) : (
            <>
              <button
                className="px-3 py-1 rounded-full border border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100"
                onClick={() => router.push('/cart/group')}
              >
                Group Cart
              </button>
              <button
                className="px-3 py-1 rounded-full border border-teal-300 text-teal-900 bg-teal-50 hover:bg-teal-100"
                onClick={() => router.push('/cart/country-group')}
              >
                Country Group Cart
              </button>
            </>
          )}

          {userRole === 'ADMIN' && (
            <button
              className="px-3 py-1 rounded-full border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
              onClick={() => router.push('/payment-methods')}
            >
              Payment Methods
            </button>
          )}

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

      <div className="grid md:grid-cols-2 gap-6 p-6">
        {data?.restaurants
          .filter(restaurant => {
            // Admin can see all restaurants
            if (userRole === 'ADMIN') return true;
            // Managers and members can only see restaurants from their country
            return restaurant.country === userCountry;
          })
          .map((r) => (
          <div
            key={r.id}
            className="bg-white/95 rounded-2xl shadow-lg p-4 border-2 border-indigo-200"
          >
            <h2 className="text-lg font-semibold text-slate-900">{r.name}</h2>
            <p className="text-xs font-semibold text-indigo-600 mb-2">
              Country: {r.country}
            </p>
            <ul className="space-y-2">
              {r.menus.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm text-slate-800">
                  <span>
                    {m.name} – ${m.price}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                      onClick={() => addToLocalCart(Number(r.id), Number(m.id), m.name)}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                      onClick={() => addToIndividualCart(Number(r.id), Number(m.id), m.name, m.price)}
                    >
                      Single
                    </button>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-full bg-purple-500 text-white hover:bg-purple-600 shadow-sm"
                      onClick={() => addToGroupCart(Number(r.id), Number(m.id), m.name, m.price)}
                    >
                      Group
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Simple cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 text-white shadow-lg px-6 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold text-black">Cart:</span>{' '}
            {cart.map((c) => `${c.name} x${c.quantity}`).join(', ')}
          </div>
          <button
            className="rounded-full bg-emerald-400 text-slate-900 text-sm px-4 py-1 hover:bg-emerald-300"
            onClick={placeOrder}
          >
            Place Order
          </button>
        </div>
      )}

      {/* Single Cart Modal */}
      {showSingleModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Single Cart Order</h2>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                <span className="font-semibold">Restaurant:</span> {selectedItem.restaurantName}
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-slate-900">{selectedItem.name}</span>
                  <span className="text-slate-700">${selectedItem.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Quantity:</span>
                  <div className="flex items-center gap-1">
                    <button
                      className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300 text-sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span className="font-medium px-3 py-1 bg-white rounded border border-blue-200 min-w-[3rem] text-center text-black">
                      {quantity}
                    </span>
                    <button
                      className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300 text-sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-slate-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  ${(selectedItem.price * quantity).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 font-medium"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 font-medium"
                  onClick={handlePlaceOrder}
                >
                  Place Order
                </button>
                <button
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
                  onClick={() => {
                    setShowSingleModal(false);
                    setQuantity(1);
                    setSelectedItem(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}