"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyAuthProvider } from "./privy-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyAuthProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyAuthProvider>
  );
}
