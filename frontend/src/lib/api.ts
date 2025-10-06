import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, GoogleAuthRequest, GoogleTokenVerifyRequest, EmailLoginRequest, EmailRegisterRequest, User } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  // Auth endpoints
  async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/google', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  async verifyGoogleToken(data: GoogleTokenVerifyRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/google/verify', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  async emailLogin(data: EmailLoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/email/login', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  async emailRegister(data: EmailRegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/email/register', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.client.get('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    this.clearToken();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; app: string; version: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
