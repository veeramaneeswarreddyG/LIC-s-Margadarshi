export interface User {
  uid: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  photoURL?: string;
  hasPassword?: boolean;
  createdAt?: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  phoneNumber: string;
  password?: string;
}

export interface SignupData {
  phoneNumber: string;
  name: string;
  email?: string;
  password?: string;
}

export interface OTPVerificationData {
  verificationId: string;
  otp: string;
}
