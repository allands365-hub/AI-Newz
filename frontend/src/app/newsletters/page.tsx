'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  EyeIcon, 
  PencilIcon,
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Newsletter {
  id: number;
  title: string;
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  sentAt?: string;
  content: string;
}

export default function NewslettersPage() {
  const { requireAuth, isLoading } = useAuth();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  useEffect(() => {
    // Mock data for now
    const mockNewsletters: Newsletter[] = [
      {
        id: 1,
        title: "Weekly Tech Roundup",
        status: "sent",
        createdAt: "2024-01-15T10:00:00Z",
        sentAt: "2024-01-15T10:30:00Z",
        content: "This week in technology..."
      },
      {
        id: 2,
        title: "AI Trends Report",
        status: "draft",
        createdAt: "2024-01-16T14:00:00Z",
        content: "Latest AI developments..."
      },
      {
        id: 3,
        title: "Startup Funding News",
        status: "sent",
        createdAt: "2024-01-14T09:00:00Z",
        sentAt: "2024-01-14T09:15:00Z",
        content: "This week's funding rounds..."
      }
    ];
    
    setNewsletters(mockNewsletters);
    setLoading(false);
  }, []);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-ai-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-ai-gradient-soft">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold bg-ai-gradient bg-clip-text text-transparent">
                Newsletters
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage your AI-powered newsletters
              </p>
            </div>
            <Link
              href="/newsletter/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Newsletter
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Newsletters</p>
                  <p className="text-2xl font-semibold text-gray-900">{newsletters.length}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Newsletter List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Newsletters</h3>
            </div>
            
            {newsletters.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No newsletters</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new newsletter.</p>
                <div className="mt-6">
                  <Link
                    href="/newsletter/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Newsletter
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {newsletters.map((newsletter) => (
                  <div key={newsletter.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {newsletter.title}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-500">
                                Created {formatDate(newsletter.createdAt)}
                              </p>
                              {newsletter.sentAt && (
                                <p className="text-sm text-gray-500">
                                  Sent {formatDate(newsletter.sentAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(newsletter.status)}`}>
                          {newsletter.status}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
