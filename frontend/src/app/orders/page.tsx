'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      status
      createdAt
      items {
        menuItemName
        menuItemPrice
        quantity
      }
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

const CANCEL_ORDER = gql`
mutation CancelOrder($orderId: Int!) {
  cancelOrder(orderId: $orderId) {
    id
    status
  }
}
`;

type MyOrdersData = {
  myOrders: Array<{
    id: string;
    status: string;
    createdAt: string;
    items: {
      menuItemName: string;
      menuItemPrice: number;
      quantity: number;
    }[];
  }>;
};

export default function OrdersPage() {

  const router = useRouter();

  const { data, loading, error, refetch } = useQuery<MyOrdersData>(MY_ORDERS, {
    // Ensure the list reflects newly created orders instead of showing stale cached data.
    fetchPolicy: 'network-only',
  });

  const [checkoutOrder] = useMutation(CHECKOUT_ORDER);
  const [cancelOrder] = useMutation(CANCEL_ORDER);

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {

    const stored = localStorage.getItem('user');

    if (!stored) {
      router.push('/login');
      return;
    }

    setUserRole(JSON.parse(stored).role);

  }, [router]);



  const onCancel = async (orderId: number) => {

    try {

      await cancelOrder({
        variables: { orderId }
      });

      alert("Order Cancelled ❌");

      await refetch();

    } catch (err) {

      console.error(err);
      alert("Cancel failed");

    }

  };



  const onCheckout = async (orderId: number) => {

    try {

      await checkoutOrder({
        variables: {
          orderId: orderId,
          paymentMethodId: 1
        }
      });

      alert("Payment Successful ✅");

      await refetch();

    } catch (err) {

      console.error(err);
      alert("Checkout failed");

    }

  };



  if (loading) return <p className="p-6 text-slate-700">Loading...</p>;

  if (error) return <p className="p-6 text-red-600">{error.message}</p>;



  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-teal-200">

        <h1 className="text-xl font-semibold text-slate-900">
          My Orders
        </h1>

        <div className="flex gap-2">
          <button
            className="text-sm px-3 py-1 rounded-full border border-slate-300 text-slate-900 bg-white hover:bg-slate-100"
            onClick={() => router.push('/restaurants')}
          >
            Back to Restaurants
          </button>
          <button
            className="text-sm px-3 py-1 rounded-full border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
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



      <div className="p-6 space-y-4">

        {data?.myOrders.map((o) => (

            <div
              key={o.id}
              className="bg-white/95 rounded-xl shadow-md p-4 border border-emerald-200"
            >

            <div className="flex justify-between text-sm mb-2">

              <span className="text-slate-900">
                <span className="font-semibold">
                  Order #{o.id}
                </span> – {o.status}
              </span>

              <span className="text-xs text-slate-500">
                {new Date(o.createdAt).toLocaleString()}
              </span>

            </div>



            <ul className="text-sm space-y-1 text-slate-800">

              {o.items.map((i, idx) => (

                <li key={idx}>
                  {i.menuItemName} x{i.quantity} – ${i.menuItemPrice}
                </li>

              ))}

            </ul>



            {userRole !== 'MEMBER' && (

              <div className="mt-3 flex gap-2 text-xs">

                <button
                  className="px-3 py-1 rounded border border-slate-300 text-slate-900 bg-white hover:bg-slate-100"
                  onClick={() => onCancel(Number(o.id))}
                >
                  Cancel
                </button>

                <button
                  className="px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => onCheckout(Number(o.id))}
                >
                  Checkout & Pay
                </button>

              </div>

            )}

          </div>

        ))}

      </div>

    </main>

  );

}