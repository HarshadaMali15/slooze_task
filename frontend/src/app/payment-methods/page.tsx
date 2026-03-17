'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const MY_PAYMENT_METHODS = gql`
  query MyPaymentMethods {
    myPaymentMethods {
      id
      brand
      last4
      country
    }
  }
`;

const ADD_PAYMENT_METHOD = gql`
  mutation AddPaymentMethod($brand: String!, $last4: String!) {
    addPaymentMethod(brand: $brand, last4: $last4) {
      id
      brand
      last4
      country
    }
  }
`;

type MyPaymentMethodsData = {
  myPaymentMethods: Array<{ id: string; brand: string; last4: string; country: string }>;
};

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [brand, setBrand] = useState('');
  const [last4, setLast4] = useState('');
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const { data, loading, error: queryError, refetch } =
    useQuery<MyPaymentMethodsData>(MY_PAYMENT_METHODS);
  const [addPaymentMethod, { loading: adding }] = useMutation(ADD_PAYMENT_METHOD);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    setUserRole(user.role);
    if (user.role !== 'ADMIN') {
      router.push('/restaurants');
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await addPaymentMethod({ variables: { brand, last4 } });
      setBrand('');
      setLast4('');
      await refetch();
    } catch (err: any) {
      setError(err.message ?? 'Failed to add payment method');
    }
  };

  if (loading) return <p className="p-4">Loading…</p>;
  if (queryError) return <p className="p-4 text-red-600">{queryError.message}</p>;
  if (userRole !== 'ADMIN') return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400">
      <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur shadow-sm border-b border-amber-200">
        <h1 className="text-xl font-semibold text-slate-900">
          Payment Methods (Admin)
        </h1>
        <div className="flex gap-2">
          <button
            className="text-sm text-slate-900 px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-100"
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

      <div className="p-6 grid md:grid-cols-2 gap-6">
        <section className="bg-white/95 rounded-xl shadow-md p-4 border border-amber-200">
        <h2 className="font-semibold mb-2 text-slate-900">
        Existing Methods
        </h2>
        <ul className="text-sm text-slate-800 space-y-1">
            {data?.myPaymentMethods.map((pm) => (
              <li key={pm.id}>
                {pm.brand} ••••{pm.last4} ({pm.country})
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white/95 rounded-xl shadow-md p-4 border border-rose-200">
        <h2 className="font-semibold mb-2 text-slate-900">
        Add Payment Method
        </h2>
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <form onSubmit={onSubmit} className="space-y-3 text-sm">
            <div>
            <label className="block mb-1 text-slate-800">Brand</label>
              <input
                className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-slate-900">Last 4</label>
              <input
                className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-slate-900"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="rounded bg-slate-900 text-white px-4 py-1"
            >
              {adding ? 'Saving…' : 'Save'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}