'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface UserProgress {
  profile_completed: boolean;
  policies_added: number;
  goals_added: number;
  calculations_done: number;
  payments_done: number;
  completion_percentage: number;
  last_updated: number;
}

export interface UserPolicy {
  id: string;
  name: string;
  type: string;
  sum: string;
  premium: string;
  nextDue: string;
  paidPct: number;
  status: string;
}

export interface UserActivity {
  id: string;
  type: 'payment' | 'policy' | 'alert' | 'success' | 'info';
  text: string;
  sub: string;
  timestamp: number;
}

export interface User {
  uid: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  photoURL?: string;
  hasPassword?: boolean;
  progress?: UserProgress;
  policies?: UserPolicy[];
  activities?: UserActivity[];
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
  // Always start with loading: true on BOTH server and client.
  // This prevents hydration mismatch caused by sessionStorage being
  // unavailable during SSR but available on the client.
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
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

  // Restore session from sessionStorage after mount (client-only).
  // Both server and client now render the same initial loading state,
  // eliminating the hydration mismatch.
  useEffect(() => {
    const stored = getSessionUser();
    setAuthState({ user: stored, loading: false, error: null });
  }, []);

  // ─── signInWithPhone ───────────────────────────────────────────────────────
  const signInWithPhone = async (
    phoneNumber: string,
    _recaptchaVerifier?: any
  ): Promise<ConfirmationResult> => {
    setLoading(true);
    clearError();
    await new Promise(r => setTimeout(r, 800)); // simulate network
    setLoading(false);

    const verificationId = `vid-${Date.now()}`;
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Store OTP in session storage to verify later
    const pendingVerifications = JSON.parse(sessionStorage.getItem('lic_pending_otps') || '{}');
    pendingVerifications[verificationId] = { otp: generatedOTP, phone: phoneNumber, expiresAt: Date.now() + 5 * 60 * 1000 };
    sessionStorage.setItem('lic_pending_otps', JSON.stringify(pendingVerifications));

    // Simulate sending SMS (Pop up an alert so the user actually sees it like a phone notification)
    window.alert(`💬 SIMULATED SMS to ${phoneNumber}:\n\nYour LIC Margadarshi verification code is ${generatedOTP}. Valid for 5 minutes.`);

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

    const pendingVerifications = JSON.parse(sessionStorage.getItem('lic_pending_otps') || '{}');
    const record = pendingVerifications[_vid];

    if (!record) {
      setLoading(false);
      const err = 'Verification session expired. Please request a new OTP.';
      setError(err);
      throw new Error(err);
    }

    if (record.expiresAt < Date.now()) {
      delete pendingVerifications[_vid];
      sessionStorage.setItem('lic_pending_otps', JSON.stringify(pendingVerifications));
      setLoading(false);
      const err = 'OTP has expired. Please generate a new OTP.';
      setError(err);
      throw new Error(err);
    }

    if (otp !== record.otp) {
      setLoading(false);
      const err = 'Incorrect OTP. Please check and re-enter.';
      setError(err);
      throw new Error(err);
    }

    // OTP verified successfully, clean up
    delete pendingVerifications[_vid];
    sessionStorage.setItem('lic_pending_otps', JSON.stringify(pendingVerifications));

    // Check if user exists with this phone number
    const defaultProgress: UserProgress = {
      profile_completed: false,
      policies_added: 0,
      goals_added: 0,
      calculations_done: 0,
      payments_done: 0,
      completion_percentage: 0,
      last_updated: Date.now()
    };

    const mockUser: User = {
      uid: `uid-${Date.now()}`,
      phoneNumber: record.phone,
      name: undefined, // means new user
      progress: defaultProgress,
      policies: [],
      activities: []
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

    const defaultProgress: UserProgress = {
      profile_completed: true, // completed basic profile during signup
      policies_added: 0,
      goals_added: 0,
      calculations_done: 0,
      payments_done: 0,
      completion_percentage: 30, // 30% for profile
      last_updated: Date.now()
    };

    const newUser: User & { password?: string } = {
      uid: `uid-${Date.now()}`,
      phoneNumber,
      name,
      email,
      hasPassword: !!password,
      password: password || undefined,
      progress: defaultProgress,
      policies: [],
      activities: [{ id: Date.now().toString(), type: 'success', text: 'Account created', sub: 'Welcome to LIC Margadarshi', timestamp: Date.now() }]
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
