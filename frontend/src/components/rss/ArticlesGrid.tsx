"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Filter, 
  Search,
  Grid3X3,
  List,
  ChevronDown
} from 'lucide-react';
import ArticleCard from './ArticleCard';
import { ArticlesGridProps, EnhancedArticle } from '@/types/rss';

export default function ArticlesGrid({ 
  articles, 
  loading, 
  onRead, 
  onShare, 
  onEmail, 
  onLoadMore, 
  hasMore,
  selectedSource,
  onSourceFilter 
}: ArticlesGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    hasImages: null as boolean | null,
    qualityMin: 0,
    platform: ''
  });

  // Filter articles based on search and filters
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filters.category === '' || article.category === filters.category;
    const matchesImages = filters.hasImages === null || article.has_images === filters.hasImages;
    const matchesQuality = article.quality_score >= filters.qualityMin;
    const matchesPlatform = filters.platform === '' || article.rss_source_platform === filters.platform;
    
    return matchesSearch && matchesCategory && matchesImages && matchesQuality && matchesPlatform;
  });

  // Get unique values for filter options
  const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));
  const platforms = Array.from(new Set(articles.map(a => a.rss_source_platform).filter(Boolean)));

  const handleRead = (article: EnhancedArticle) => {
    // Delegate opening behavior to parent onRead to avoid double window.open
    onRead(article);
  };

  const handleShare = (article: EnhancedArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: article.url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(article.url);
    }
    onShare(article);
  };

  const handleEmail = (article: EnhancedArticle) => {
    const subject = encodeURIComponent(`Check out this article: ${article.title}`);
    const body = encodeURIComponent(`I thought you might be interested in this article:\n\n${article.title}\n${article.url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    onEmail(article);
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh articles"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Platform Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    value={filters.platform}
                    onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Platforms</option>
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>

                {/* Images Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                  <select
                    value={filters.hasImages === null ? '' : filters.hasImages.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      hasImages: e.target.value === '' ? null : e.target.value === 'true' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Articles</option>
                    <option value="true">With Images</option>
                    <option value="false">Without Images</option>
                  </select>
                </div>

                {/* Quality Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Quality</label>
                  <select
                    value={filters.qualityMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, qualityMin: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={0}>Any Quality</option>
                    <option value={0.3}>Good (0.3+)</option>
                    <option value={0.5}>Very Good (0.5+)</option>
                    <option value={0.7}>Excellent (0.7+)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredArticles.length} of {articles.length} articles
        </p>
        {selectedSource && (
          <button
            onClick={() => onSourceFilter(undefined)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear source filter
          </button>
        )}
      </div>

      {/* Articles Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <motion.div
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }
          layout
        >
          <AnimatePresence>
            {filteredArticles.map((article) => (
              <motion.div
                key={article.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ArticleCard
                  article={article}
                  onRead={handleRead}
                  onShare={handleShare}
                  onEmail={handleEmail}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || Object.values(filters).some(f => f !== '' && f !== null && f !== 0)
              ? 'Try adjusting your search or filters'
              : 'No articles available at the moment'
            }
          </p>
          {(searchQuery || Object.values(filters).some(f => f !== '' && f !== null && f !== 0)) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({ category: '', hasImages: null, qualityMin: 0, platform: '' });
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && filteredArticles.length > 0 && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Loading...' : 'Load More Articles'}
          </button>
        </div>
      )}
    </div>
  );
}
