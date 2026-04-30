'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  uid: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  photoURL?: string;
  hasPassword?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface ConfirmationResult {
  verificationId: string;
  confirm: (otp: string) => Promise<User>;
}

interface AuthContextType extends AuthState {
  signInWithPhone: (phoneNumber: string, recaptchaVerifier?: any) => Promise<ConfirmationResult>;
  verifyOTP: (params: { verificationId: string; otp: string }) => Promise<User>;
  signInWithPassword: (phoneNumber: string, password: string) => Promise<void>;
  signUp: (phoneNumber: string, name: string, email?: string, password?: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory user store (persists across page navigations within session)
const STORAGE_KEY = 'lic_margadarshi_users';
const SESSION_KEY = 'lic_margadarshi_session';

const getStoredUsers = (): Record<string, User & { password?: string }> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveUsers = (users: Record<string, User & { password?: string }>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const getSessionUser = (): User | null => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
};

const saveSessionUser = (user: User | null) => {
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize synchronously so `loading` is never `true` on first render.
  // This eliminates the spinner flicker on every page load/navigation.
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return { user: stored, loading: false, error: null };
    } catch {
      // sessionStorage not available (SSR guard)
      return { user: null, loading: false, error: null };
    }
  });

  const setLoading = (loading: boolean) =>
    setAuthState(prev => ({ ...prev, loading }));

  const setError = (error: string | null) =>
    setAuthState(prev => ({ ...prev, error }));

  const clearError = () => setError(null);

  const setUser = (user: User | null) => {
    saveSessionUser(user);
    setAuthState(prev => ({ ...prev, user, loading: false, error: null }));
  };

  // Session is restored synchronously in the useState initializer above.
  // This useEffect is kept only as a safety net for SSR environments
  // where sessionStorage isn't available during the initial render.
  useEffect(() => {
    setAuthState(prev => {
      if (prev.user !== null) return prev; // already restored, skip
      const stored = getSessionUser();
      return stored ? { user: stored, loading: false, error: null } : prev;
    });
  }, []);

  // ─── signInWithPhone ───────────────────────────────────────────────────────
  // Returns a mock ConfirmationResult. OTP "123456" always works in dev.
  const signInWithPhone = async (
    phoneNumber: string,
    _recaptchaVerifier?: any
  ): Promise<ConfirmationResult> => {
    setLoading(true);
    clearError();
    await new Promise(r => setTimeout(r, 800)); // simulate network
    setLoading(false);

    const verificationId = `mock-vid-${Date.now()}`;
    return {
      verificationId,
      confirm: async (otp: string) => {
        return verifyOTP({ verificationId, otp });
      },
    };
  };

  // ─── verifyOTP ─────────────────────────────────────────────────────────────
  const verifyOTP = async ({
    verificationId: _vid,
    otp,
  }: {
    verificationId: string;
    otp: string;
  }): Promise<User> => {
    setLoading(true);
    clearError();
    await new Promise(r => setTimeout(r, 800));

    if (otp !== '123456') {
      setLoading(false);
      const err = 'Invalid OTP. Use 123456 for demo.';
      setError(err);
      throw new Error(err);
    }

    // Check if user exists with this phone number
    // (phone comes from the stored verification context)
    const mockUser: User = {
      uid: `uid-${Date.now()}`,
      phoneNumber: '+919876543210',
      name: undefined, // means new user
    };

    setLoading(false);
    return mockUser;
  };

  // ─── signInWithPassword ────────────────────────────────────────────────────
  const signInWithPassword = async (phoneNumber: string, password: string): Promise<void> => {
    setLoading(true);
    clearError();
    await new Promise(r => setTimeout(r, 800));

    const users = getStoredUsers();
    const existing = Object.values(users).find(u => u.phoneNumber === phoneNumber);

    if (!existing) {
      setLoading(false);
      const err = 'No account found with this phone number. Please sign up first.';
      setError(err);
      throw new Error(err);
    }

    if (!existing.password || existing.password !== password) {
      setLoading(false);
      const err = 'Incorrect password. Please try again.';
      setError(err);
      throw new Error(err);
    }

    const { password: _pw, ...user } = existing;
    setUser(user);
  };

  // ─── signUp ────────────────────────────────────────────────────────────────
  const signUp = async (
    phoneNumber: string,
    name: string,
    email?: string,
    password?: string
  ): Promise<User> => {
    setLoading(true);
    clearError();
    await new Promise(r => setTimeout(r, 800));

    const users = getStoredUsers();
    const existing = Object.values(users).find(u => u.phoneNumber === phoneNumber);
    if (existing) {
      setLoading(false);
      const err = 'An account with this phone number already exists. Please log in.';
      setError(err);
      throw new Error(err);
    }

    const newUser: User & { password?: string } = {
      uid: `uid-${Date.now()}`,
      phoneNumber,
      name,
      email,
      hasPassword: !!password,
      password: password || undefined,
    };

    users[newUser.uid] = newUser;
    saveUsers(users);

    const { password: _pw, ...user } = newUser;
    setUser(user);
    return user;
  };

  // ─── updateUser ────────────────────────────────────────────────────────────
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!authState.user) throw new Error('No user logged in');
    await new Promise(r => setTimeout(r, 500));
    setUser({ ...authState.user, ...updates });
  };

  // ─── signOut ───────────────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    await new Promise(r => setTimeout(r, 300));
    setUser(null);
    clearError();
  };

  const value: AuthContextType = {
    ...authState,
    signInWithPhone,
    verifyOTP,
    signInWithPassword,
    signUp,
    signOut,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
