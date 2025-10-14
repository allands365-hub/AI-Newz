"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Mail, 
  Share2, 
  Star, 
  Clock, 
  Globe,
  User,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ArticleCardProps } from '@/types/rss';

export default function ArticleCard({ article, onRead, onShare, onEmail }: ArticleCardProps) {
  const handleRead = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any ancestor handlers from also triggering navigation
    e.stopPropagation();
    onRead(article);
  };

  const handleShare = () => {
    onShare(article);
  };

  const handleEmail = () => {
    onEmail(article);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
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

  const getVerificationIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <div className="w-2 h-2 bg-green-500 rounded-full" title="Verified" />;
      case 'pending':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Pending verification" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.image_alt_text || article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback for missing images */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-200 to-blue-200 flex items-center justify-center"
          style={{ display: article.image_url ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No image available</p>
          </div>
        </div>
        
        {/* Source Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2 shadow-sm">
          {(() => {
            try {
              const host = (() => {
                try { return new URL(article.url).hostname.replace(/^www\./, ''); } catch { return ''; }
              })();
              // Prefer provided logo; otherwise use backend favicon proxy
              const { API_BASE_URL } = require('@/lib/api-config');
              const proxy = `${API_BASE_URL}/api/v1/rss/favicon?host=${encodeURIComponent(host)}&v=1`;
              const src = article.rss_source_logo || proxy;
              return (
                <img
                  src={src}
                  alt={article.rss_source_name}
                  className="w-5 h-5 rounded object-cover bg-white border border-gray-200"
                  onError={(e) => {
                    // Hide image and show globe fallback
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    const fallback = (e.currentTarget.nextElementSibling as HTMLElement);
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              );
            } catch {
              return null;
            }
          })()}
          <div className={`w-5 h-5 hidden rounded ${getPlatformColor(article.rss_source_platform)} flex items-center justify-center`}>
            <Globe className="w-3 h-3 text-white" />
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-700">{article.rss_source_name}</span>
            {getVerificationIcon(article.rss_source_verification)}
          </div>
        </div>
        
        {/* Quality Score */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-700">
              {Number.isFinite(Number(article.quality_score)) ? Number(article.quality_score).toFixed(1) : '0.0'}
            </span>
          </div>
        </div>

        {/* Content Type Badge */}
        {article.content_type && article.content_type !== 'article' && (
          <div className="absolute bottom-3 left-3 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
            {article.content_type.charAt(0).toUpperCase() + article.content_type.slice(1)}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {article.title}
        </h3>
        
        {article.summary && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {(() => {
              try {
                const txt = document.createElement('textarea');
                txt.innerHTML = article.summary;
                const decoded = txt.value;
                // Strip HTML tags
                return decoded.replace(/<[^>]*>/g, ' ');
              } catch {
                return article.summary;
              }
            })()}
          </p>
        )}
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{article.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            {article.author && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-24">{article.author}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(article.published_at)}</span>
            </div>
            {article.reading_time && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{article.reading_time} min</span>
              </div>
            )}
          </div>
          
          {/* Content indicators */}
          <div className="flex items-center space-x-2">
            {article.has_images && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Contains images" />
            )}
            {article.has_videos && (
              <div className="w-2 h-2 bg-red-500 rounded-full" title="Contains videos" />
            )}
            {article.has_lists && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Contains lists" />
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleRead}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Read Article</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEmail}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              title="Email article"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              title="Share article"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
