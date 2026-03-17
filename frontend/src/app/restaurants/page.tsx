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

const CREATE_ORDER = gql`
  mutation CreateOrder($restaurantId: Int!, $items: [CreateOrderItemInput!]!) {
    createOrder(restaurantId: $restaurantId, items: $items) {
      id
      status
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
  const [createOrder] = useMutation<CreateOrderMutationData>(CREATE_ORDER);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUserRole(JSON.parse(stored).role);
  }, [router]);

  const addToCart = (restaurantId: number, menuItemId: number, name: string) => {
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
        {data?.restaurants.map((r) => (
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
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                    onClick={() => addToCart(Number(r.id), Number(m.id), m.name)}
                  >
                    Add
                  </button>
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
            <span className="font-semibold">Cart:</span>{' '}
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
    </main>
  );
}