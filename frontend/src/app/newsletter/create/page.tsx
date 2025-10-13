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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold bg-ai-gradient bg-clip-text text-transparent">
                Create Newsletter
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Generate AI-powered newsletters with Grok
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <NewsletterGenerator />
      </div>
    </div>
  );
}
