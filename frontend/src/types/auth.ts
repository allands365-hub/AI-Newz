export interface User {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  auth_provider: 'google' | 'email';
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token: string; // Alias for access_token for compatibility
  token_type: string;
  expires_in: number;
  is_new_user: boolean;
  message: string;
}

export interface GoogleAuthRequest {
  code: string;
  state?: string;
}

export interface GoogleTokenVerifyRequest {
  id_token: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface EmailRegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
