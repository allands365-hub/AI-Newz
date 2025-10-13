"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Play,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  Calendar,
  Star
} from 'lucide-react';

interface RSSSource {
  id: number;
  name: string;
  url: string;
  description?: string;
  category?: string;
  language: string;
  is_active: boolean;
  credibility_score: number;
  last_fetched?: string;
  fetch_frequency: number;
  created_at: string;
  updated_at?: string;
}

interface RSSSourceListProps {
  sources: RSSSource[];
  loading: boolean;
  error: string | null;
  onEdit: (source: RSSSource) => void;
  onDelete: (id: number) => void;
  onTest: (id: number) => Promise<any>;
  onRefresh: () => void;
}

export default function RSSSourceList({
  sources,
  loading,
  error,
  onEdit,
  onDelete,
  onTest,
  onRefresh
}: RSSSourceListProps) {
  const [testingSources, setTestingSources] = useState<Set<number>>(new Set());
  const [deletingSources, setDeletingSources] = useState<Set<number>>(new Set());
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  const getHostFromUrl = (raw: string): string | null => {
    try {
      const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
      let host = new URL(normalized).hostname;
      // Strip common feed subdomains to prefer brand domain for favicons
      host = host.replace(/^www\./i, '')
                 .replace(/^feeds\./i, '')
                 .replace(/^feed\./i, '')
                 .replace(/^rss\./i, '');
      return host;
    } catch {
      // Fallback: best-effort host extraction
      const match = raw.replace(/^https?:\/\//i, '').split('/')[0];
      return match || null;
    }
  };

  const handleTest = async (id: number) => {
    setTestingSources(prev => new Set(prev).add(id));
    try {
      const result = await onTest(id);
      // You could show a toast notification here
      console.log('Test result:', result);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTestingSources(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this RSS source?')) {
      return;
    }

    setDeletingSources(prev => new Set(prev).add(id));
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingSources(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const formatLastFetched = (lastFetched?: string) => {
    if (!lastFetched) return 'Never';
    
    const date = new Date(lastFetched);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatFetchFrequency = (frequency: number) => {
    if (frequency < 60) return `${frequency}s`;
    if (frequency < 3600) return `${Math.floor(frequency / 60)}m`;
    return `${Math.floor(frequency / 3600)}h`;
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-3" />
          <div>
            <h3 className="text-red-800 font-medium">Error loading RSS sources</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={onRefresh}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No RSS sources found</h3>
        <p className="text-gray-500 mb-6">
          Get started by adding your first RSS source to begin content aggregation.
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {sources.map((source) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {(() => {
                      const host = getHostFromUrl(source.url);
                      if (!host) return null;
                      // Prefer higher-resolution providers first, cascade on error
                      // Build absolute proxy URL using API_BASE_URL to avoid Next.js base path issues
                      const { API_BASE_URL } = require('@/lib/api-config');
                      const proxy = `${API_BASE_URL}/api/v1/rss/favicon?host=${encodeURIComponent(host)}&v=1`;
                      const hiRes1 = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
                      const hiRes2 = `https://icons.duckduckgo.com/ip3/${host}.ico`;
                      const hiRes3 = `https://${host}/favicon.ico`;
                      const handleError = (img: HTMLImageElement) => {
                        if (img.src === proxy) {
                          img.src = hiRes1;
                        } else if (img.src === hiRes1) {
                          img.src = hiRes2;
                        } else if (img.src === hiRes2) {
                          img.src = hiRes3;
                        } else {
                          // All failed
                          img.style.display = 'none';
                          const fallback = img.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      };
                      return (
                        <img
                          src={proxy}
                          alt={source.name}
                          className="w-10 h-10 rounded-lg bg-white border border-gray-200 object-cover"
                          onError={(e) => handleError(e.currentTarget as HTMLImageElement)}
                          loading="lazy"
                        />
                      );
                    })()}
                    <div className="w-10 h-10 hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {source.name}
                      </h3>
                      {source.is_active ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-xs">{source.url}</span>
                      </div>
                      
                      {source.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {source.category}
                        </span>
                      )}
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCredibilityColor(source.credibility_score)}`}>
                        <Star className="w-3 h-3 inline mr-1" />
                        {getCredibilityLabel(source.credibility_score)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Last: {formatLastFetched(source.last_fetched)}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <RefreshCw className="w-3 h-3" />
                      <span>Every {formatFetchFrequency(source.fetch_frequency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleTest(source.id)}
                      disabled={testingSources.has(source.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                      title="Test RSS source"
                    >
                      {testingSources.has(source.id) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {source.description && (
                <div className="mt-3 text-sm text-gray-600">
                  {source.description}
                </div>
              )}

              <AnimatePresence>
                {expandedSource === source.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Source Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div><span className="font-medium">Language:</span> {source.language}</div>
                          <div><span className="font-medium">Credibility:</span> {(((typeof source.credibility_score === 'number' ? source.credibility_score : 0) * 100)).toFixed(1)}%</div>
                          <div><span className="font-medium">Status:</span> {source.is_active ? 'Active' : 'Inactive'}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Timing</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div><span className="font-medium">Created:</span> {new Date(source.created_at).toLocaleDateString()}</div>
                          {source.updated_at && (
                            <div><span className="font-medium">Updated:</span> {new Date(source.updated_at).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEdit(source)}
                        className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit className="w-3 h-3 inline mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDelete(source.id)}
                        disabled={deletingSources.has(source.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingSources.has(source.id) ? (
                          <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 inline mr-1" />
                        )}
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
