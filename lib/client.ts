import { ApolloClient, InMemoryCache } from '@apollo/client';
import { useMemo } from 'react';

const protocol = `${
  process.env.NODE_ENV === 'development' ? 'http' : 'https'
}://`;

const host =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000'
    : // Use host on the client since using VERCEL_URL can lead to CORS errors due to aliases
      window.location.host;

export const origin = `${protocol}${host}`;

export default function useClient() {
  const client = useMemo(() => {
    return new ApolloClient({
      uri: `${origin}/api`,
      cache: new InMemoryCache(),
    });
  }, []);

  return client;
}
