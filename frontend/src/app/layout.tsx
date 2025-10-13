import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppLayout } from '@/components/layout';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI-Newz - AI-Powered Newsletter Creation',
  description: 'Create AI-powered newsletters in minutes. Aggregate content, detect trends, and generate ready-to-send newsletters.',
  keywords: 'newsletter, AI, content creation, automation, email marketing',
  authors: [{ name: 'AI-Newz Team' }],
  openGraph: {
    title: 'AI-Newz - AI-Powered Newsletter Creation',
    description: 'Create AI-powered newsletters in minutes. Aggregate content, detect trends, and generate ready-to-send newsletters.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Newz - AI-Powered Newsletter Creation',
    description: 'Create AI-powered newsletters in minutes. Aggregate content, detect trends, and generate ready-to-send newsletters.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
