'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

interface ConvexStateContextType {
  isConfigured: boolean;
  convexUrl: string | null;
}

const ConvexStateContext = createContext<ConvexStateContextType>({
  isConfigured: false,
  convexUrl: null,
});

export const useConvexStatus = () => useContext(ConvexStateContext);

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || null;

  const client = useMemo(() => {
    if (convexUrl && convexUrl.startsWith('http')) {
      try {
        return new ConvexReactClient(convexUrl);
      } catch (err) {
        console.warn('Could not initialize Convex client:', err);
        return null;
      }
    }
    return null;
  }, [convexUrl]);

  const contextValue = useMemo(
    () => ({
      isConfigured: !!client,
      convexUrl,
    }),
    [client, convexUrl]
  );

  return (
    <ConvexStateContext.Provider value={contextValue}>
      {client ? <ConvexProvider client={client}>{children}</ConvexProvider> : children}
    </ConvexStateContext.Provider>
  );
}
