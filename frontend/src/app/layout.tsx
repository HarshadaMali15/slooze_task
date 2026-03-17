'use client';

import './globals.css';
import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo-client';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
      </body>
    </html>
  );
}