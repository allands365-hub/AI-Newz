'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

interface Newsletter {
  id: string;
  title: string;
  topic: string;
  status: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  read_time_minutes?: string;
  tags?: string[];
}

interface NewsletterListProps {
  onEdit?: (newsletter: Newsletter) => void;
  onView?: (newsletter: Newsletter) => void;
  onDelete?: (newsletterId: string) => void;
  onPublish?: (newsletterId: string) => void;
  onEmail?: (newsletter: Newsletter) => void;
}

export default function NewsletterList({ onEdit, onView, onDelete, onPublish, onEmail }: NewsletterListProps) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINTS.NEWSLETTERS.LIST, {
        headers,
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch newsletters');
      }

      const data = await response.json();
      setNewsletters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const handleDelete = async (newsletterId: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) {
      return;
    }

    try {
      setDeletingId(newsletterId);
      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINTS.NEWSLETTERS.DELETE(newsletterId), {
        headers,
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete newsletter');
      }

      // Remove from local state
      setNewsletters(prev => prev.filter(n => n.id !== newsletterId));
      
      if (onDelete) {
        onDelete(newsletterId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete newsletter');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (newsletterId: string) => {
    try {
      setPublishingId(newsletterId);
      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINTS.NEWSLETTERS.PUBLISH(newsletterId), {
        headers,
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to publish newsletter');
      }

      // Update local state
      setNewsletters(prev => prev.map(n => 
        n.id === newsletterId 
          ? { ...n, is_published: true, status: 'published' }
          : n
      ));
      
      if (onPublish) {
        onPublish(newsletterId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish newsletter');
    } finally {
      setPublishingId(null);
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

  const getStatusColor = (status: string, isPublished: boolean) => {
    if (isPublished) return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-gray-100 text-gray-800';
    if (status === 'generated') return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchNewsletters}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No newsletters</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new newsletter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {newsletters.map((newsletter) => (
        <motion.div
          key={newsletter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {newsletter.title}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(newsletter.status, newsletter.is_published)}`}>
                  {newsletter.is_published ? 'Published' : newsletter.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{newsletter.topic}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(newsletter.created_at)}
                </div>
                {newsletter.read_time_minutes && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {newsletter.read_time_minutes}
                  </div>
                )}
                {newsletter.tags && newsletter.tags.length > 0 && (
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {newsletter.tags.slice(0, 2).join(', ')}
                    {newsletter.tags.length > 2 && ` +${newsletter.tags.length - 2}`}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {onView && (
                <button
                  onClick={() => onView(newsletter)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="View newsletter"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={() => onEdit(newsletter)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit newsletter"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
              
              {onEmail && (
                <button
                  onClick={() => onEmail(newsletter)}
                  className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                  title="Send via email"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                </button>
              )}
              
              {!newsletter.is_published && onPublish && (
                <button
                  onClick={() => handlePublish(newsletter.id)}
                  disabled={publishingId === newsletter.id}
                  className="p-2 text-green-400 hover:text-green-600 transition-colors disabled:opacity-50"
                  title="Publish newsletter"
                >
                  {publishingId === newsletter.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                  )}
                </button>
              )}
              
              <button
                onClick={() => handleDelete(newsletter.id)}
                disabled={deletingId === newsletter.id}
                className="p-2 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete newsletter"
              >
                {deletingId === newsletter.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                ) : (
                  <TrashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
