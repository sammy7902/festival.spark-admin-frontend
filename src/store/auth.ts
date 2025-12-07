import { useSyncExternalStore } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | string;
};

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

const storageKey = "billify_auth";

const loadInitialState = (): AuthState => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { token: null, user: null };
    }
    const parsed = JSON.parse(raw) as AuthState;
    return {
      token: parsed.token || null,
      user: parsed.user || null
    };
  } catch {
    return { token: null, user: null };
  }
};

let authState: AuthState =
  typeof window !== "undefined" ? loadInitialState() : { token: null, user: null };

type Listener = () => void;
const listeners = new Set<Listener>();

export const getAuthState = (): AuthState => authState;

export const getAuthToken = (): string | null => authState.token;

export const setAuthState = (next: AuthState): void => {
  authState = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }
  listeners.forEach((listener) => listener());
};

export const setAuth = (token: string, user: AuthUser): void => {
  // Normalize user ID (handle both _id and id from backend)
  const normalizedUser: AuthUser = {
    ...user,
    id: (user as any)._id || user.id || '',
  };
  
  setAuthState({
    token,
    user: normalizedUser,
  });
  
  if (import.meta.env.DEV) {
    console.log('✅ Auth state updated:', { 
      hasToken: !!token, 
      user: normalizedUser.name,
      email: normalizedUser.email 
    });
  }
};

export const clearAuth = (): void => {
  authState = { token: null, user: null };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(storageKey);
      if (import.meta.env.DEV) {
        console.log('🔓 Auth cleared');
      }
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }
  listeners.forEach((listener) => listener());
};

export const useAuthStore = <T>(selector: (state: AuthState) => T): T => {
  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = (): T => selector(authState);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};


