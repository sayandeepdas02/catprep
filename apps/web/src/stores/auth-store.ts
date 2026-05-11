import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@techscholars/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      needsOnboarding: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, needsOnboarding: !(user as any)?.onboardingCompleted }),
      setTokens: (tokens) => set({ tokens }),
      setLoading: (isLoading) => set({ isLoading }),
      login: (user, tokens) =>
        set({ 
          user, 
          tokens, 
          isAuthenticated: true, 
          isLoading: false,
          needsOnboarding: !(user as any)?.onboardingCompleted 
        }),
      logout: () =>
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false, needsOnboarding: true }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      completeOnboarding: () =>
        set((state) => ({
          needsOnboarding: false,
          user: state.user ? { ...state.user, onboardingCompleted: true } as User : null,
        })),
    }),
    {
      name: 'techscholars-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);