# AI-Newz Frontend

Modern React frontend for AI-Newz - AI-powered newsletter creation platform.

## Features

- **Google OAuth 2.0 Integration** - Seamless sign-in with Google
- **Modern UI/UX** - Built with Next.js 14, Tailwind CSS, and Framer Motion
- **Type Safety** - Full TypeScript support
- **State Management** - Zustand for global state
- **Responsive Design** - Mobile-first approach
- **Authentication** - JWT-based authentication with automatic token management

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Clone and setup:**
```bash
# Install dependencies
npm install

# Copy environment template
cp env.local.example .env.local

# Edit configuration
nano .env.local
```

2. **Configure environment:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type check

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── dashboard/         # Dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/              # Authentication components
│   │   └── GoogleSignIn.tsx
│   └── providers/         # Context providers
│       └── AuthProvider.tsx
├── hooks/                 # Custom React hooks
│   └── useAuth.ts         # Authentication hook
├── lib/                   # Utilities and services
│   ├── api.ts             # API client
│   ├── google-auth.ts     # Google OAuth service
│   └── store/             # Zustand stores
│       └── auth.ts        # Authentication store
└── types/                 # TypeScript types
    ├── auth.ts            # Authentication types
    └── index.ts           # Type exports
```

## Authentication Flow

### Google OAuth 2.0

1. User clicks "Sign in with Google"
2. Google OAuth popup opens
3. User authenticates with Google
4. Google returns ID token
5. Frontend sends token to backend
6. Backend verifies token and returns JWT
7. Frontend stores JWT and redirects to dashboard

### Email/Password (Fallback)

1. User enters email and password
2. Frontend sends credentials to backend
3. Backend validates and returns JWT
4. Frontend stores JWT and redirects to dashboard

## Key Components

### GoogleSignIn Component

```tsx
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';

<GoogleSignIn
  onSuccess={(user) => console.log('Success:', user)}
  onError={(error) => console.error('Error:', error)}
  className="w-full"
/>
```

### useAuth Hook

```tsx
import { useAuth } from '@/hooks/useAuth';

const {
  user,
  isAuthenticated,
  isLoading,
  handleGoogleAuth,
  handleEmailLogin,
  handleLogout
} = useAuth();
```

### API Client

```tsx
import { apiClient } from '@/lib/api';

// Google OAuth
const response = await apiClient.verifyGoogleToken({ id_token: token });

// Email login
const response = await apiClient.emailLogin({ email, password });

// Get current user
const user = await apiClient.getCurrentUser();
```

## Styling

The app uses Tailwind CSS with custom design system:

- **Primary Colors**: Indigo palette
- **Secondary Colors**: Emerald palette
- **Typography**: Inter font family
- **Animations**: Framer Motion
- **Components**: Headless UI

### Custom Classes

```css
.btn-primary     /* Primary button style */
.btn-secondary   /* Secondary button style */
.input-field     /* Input field style */
.card           /* Card container */
.spinner        /* Loading spinner */
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `NEXT_PUBLIC_APP_NAME` | App name | No |
| `NEXT_PUBLIC_APP_VERSION` | App version | No |

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
6. Copy Client ID to `.env.local`

## Development

### Code Style

- ESLint for linting
- Prettier for formatting
- TypeScript for type checking

### State Management

- Zustand for global state
- Local state with React hooks
- Persistent storage for auth state

### API Integration

- Axios for HTTP requests
- Automatic token management
- Error handling and retries

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Manual Build

```bash
npm run build
npm run start
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License
