'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth-service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initAuth = async () => {
      const tokens = useAuthStore.getState().tokens;
      if (tokens?.accessToken) {
        try {
          const user = await authService.getCurrentUser();
          useAuthStore.getState().setUser(user);
        } catch {
          useAuthStore.getState().logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [mounted, setLoading]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}