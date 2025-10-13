"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  CheckCircle, 
  XCircle, 
  Star, 
  Clock, 
  Settings, 
  Trash2, 
  Play,
  AlertCircle,
  RefreshCw,
  Edit,
  TestTube
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedRSSSourceListProps, EnhancedRSSSource } from '@/types/rss';

export default function EnhancedRSSSourceList({ 
  sources, 
  loading, 
  error, 
  onEdit, 
  onDelete, 
  onTest, 
  onRefresh 
}: EnhancedRSSSourceListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getPlatformColor = (platform?: string) => {
    const colors: Record<string, string> = {
      'reddit': 'bg-orange-500',
      'hackernews': 'bg-orange-600',
      'techcrunch': 'bg-orange-500',
      'bbc': 'bg-red-600',
      'ars-technica': 'bg-gray-800',
      'wired': 'bg-black',
      'the-verge': 'bg-purple-600',
      'nature': 'bg-green-600'
    };
    return colors[platform || ''] || 'bg-gray-500';
  };

  const getVerificationStatus = (status: string) => {
    switch (status) {
      case 'verified':
        return { icon: CheckCircle, color: 'text-green-500', label: 'Verified' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', label: 'Pending' };
      case 'unverified':
        return { icon: AlertCircle, color: 'text-gray-400', label: 'Unverified' };
      default:
        return { icon: AlertCircle, color: 'text-gray-400', label: 'Unknown' };
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <XCircle className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Sources</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Globe className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No RSS Sources</h3>
        <p className="text-gray-600 mb-4">
          Add your first RSS source to start aggregating content
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {sources.map((source) => {
          const verification = getVerificationStatus(source.verification_status);
          const VerificationIcon = verification.icon;
          
          return (
            <motion.div
              key={source.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header with Logo */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {source.logo_url ? (
                      <img
                        src={source.logo_url}
                        alt={source.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full rounded-lg ${getPlatformColor(source.platform)} flex items-center justify-center`}>
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {source.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {source.platform || 'RSS Feed'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <VerificationIcon className={`w-5 h-5 ${verification.color}`} />
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className={`text-sm font-medium ${getCredibilityColor(source.credibility_score)}`}>
                        {typeof source.credibility_score === 'number' ? source.credibility_score.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {source.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {source.description}
                  </p>
                )}
                
                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-700">
                      {source.category || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Language</span>
                    <span className="font-medium text-gray-700 uppercase">
                      {source.language}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Fetched</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(source.last_fetched)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${source.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Fetch Frequency</span>
                    <span className="font-medium text-gray-700">
                      {Math.round(source.fetch_frequency / 3600)}h
                    </span>
                  </div>
                </div>

                {/* Content Focus Tags */}
                {source.content_focus && source.content_focus.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {source.content_focus.slice(0, 3).map((focus, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                        >
                          {focus}
                        </span>
                      ))}
                      {source.content_focus.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{source.content_focus.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onTest(source.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <TestTube className="w-3 h-3" />
                      <span>Test</span>
                    </button>
                    <button
                      onClick={() => onEdit(source)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <button
                    onClick={() => onDelete(source.id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                    title="Delete source"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
