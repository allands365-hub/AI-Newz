export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

class GoogleAuthService {
  private clientId: string;
  private isInitialized = false;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    if (!this.clientId) {
      console.error('Google Client ID not found. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        try {
          window.google.accounts.id.initialize({
            client_id: this.clientId,
            callback: () => {}, // Will be set by individual components
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  renderButton(element: HTMLElement, callback: (response: GoogleCredentialResponse) => void): void {
    if (!this.isInitialized) {
      console.error('Google Auth not initialized');
      return;
    }

    window.google.accounts.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'sign_in_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%',
    });

    // Set the callback
    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: callback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  disableAutoSelect(): void {
    if (this.isInitialized) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  prompt(): void {
    if (this.isInitialized) {
      window.google.accounts.id.prompt();
    }
  }

  parseJwtPayload(token: string): GoogleUserInfo | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT payload:', error);
      return null;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
