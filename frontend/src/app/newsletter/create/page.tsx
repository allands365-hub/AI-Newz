'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import NewsletterGenerator from '@/components/newsletter/NewsletterGenerator';

export default function CreateNewsletterPage() {
  const { requireAuth, isLoading } = useAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ai-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ai-gradient-soft">
      {/* Main Content */}
      <div className="py-8">
        <NewsletterGenerator />
      </div>
    </div>
  );
}
