'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        country
      }
    }
  }
`;

type LoginMutationData = {
  login: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      country: string;
    };
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState('nick.fury@slooze.xyz');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const router = useRouter();
  const [login, { loading }] = useMutation<LoginMutationData>(LOGIN);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await login({ variables: { email, password } });
      if (!data) throw new Error('Login failed (no data returned)');
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('user', JSON.stringify(data.login.user));
      router.push('/restaurants');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-sky-400">
      <form
        onSubmit={onSubmit}
        className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-8 w-full max-w-md space-y-5 border border-indigo-200"
      >
        <div className="space-y-1">
          <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Slooze Food – Admin Panel
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Login</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Demo users (password for all: <span className="font-mono">password123</span>):
            <br />• Admin: <span className="font-mono">nick.fury@slooze.xyz</span>
            <br />• Managers: <span className="font-mono">captain.marvel@slooze.xyz</span>,{' '}
            <span className="font-mono">captain.america@slooze.xyz</span>
            <br />• Members: <span className="font-mono">thanos@slooze.xyz</span>,{' '}
            <span className="font-mono">thor@slooze.xyz</span>,{' '}
            <span className="font-mono">travis@slooze.xyz</span>
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 text-white py-2 text-sm font-semibold shadow hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="pt-1 text-[11px] text-slate-500">
          Tip: start as <span className="font-mono">nick.fury@slooze.xyz</span> (Admin) and then log
          out to try Manager & Member flows.
        </p>
      </form>
    </main>
  );
}