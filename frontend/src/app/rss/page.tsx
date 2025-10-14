'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  RssIcon, 
  EyeIcon, 
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  FunnelIcon,
  ChartBarIcon,
  ViewColumnsIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS, getAuthHeaders, API_BASE_URL } from '@/lib/api-config';
import RSSSourceList from '@/components/rss/RSSSourceList';
import EnhancedRSSSourceList from '@/components/rss/EnhancedRSSSourceList';
import ArticlesGrid from '@/components/rss/ArticlesGrid';
import RSSSourceModal from '@/components/rss/RSSSourceModal';
import AdvancedContentFilter from '@/components/rss/AdvancedContentFilter';
import RSSStats from '@/components/rss/RSSStats';
import ContentInsights from '@/components/rss/ContentInsights';
import { EnhancedRSSSource, EnhancedArticle, ContentFilter } from '@/types/rss';

export default function RSSPage() {
  const { requireAuth, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'sources' | 'articles'>('sources');
  const [showEnhancedView, setShowEnhancedView] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showContentInsights, setShowContentInsights] = useState(false);
  const [showContentFilter, setShowContentFilter] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<EnhancedRSSSource | null>(null);
  
  // Data states
  const [sources, setSources] = useState<EnhancedRSSSource[]>([]);
  const [articles, setArticles] = useState<EnhancedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<number | undefined>();
  const [contentFilters, setContentFilters] = useState({
    categories: [] as string[],
    tags: [] as string[],
    quality_range: [0, 1] as [number, number],
    sentiment_range: [-1, 1] as [number, number],
    word_count_range: [0, 10000] as [number, number],
    date_range: {
      start: null as Date | null,
      end: null as Date | null
    },
    has_images: undefined as boolean | undefined,
    has_quotes: undefined as boolean | undefined,
    has_lists: undefined as boolean | undefined,
    has_urls: undefined as boolean | undefined
  });

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // Load sources on mount; then auto-switch to Articles and fetch
  useEffect(() => {
    (async () => {
      await fetchSources();
      setViewMode('articles');
    })();
  }, []);

  useEffect(() => {
    if (viewMode === 'articles') {
      fetchArticles();
    }
  }, [viewMode]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.RSS.SOURCES, {
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch RSS sources');
      }

      const data = await response.json();
      setSources(data);
    } catch (err) {
      console.error('Error fetching sources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setArticlesLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedSource) params.append('source_id', selectedSource.toString());
      // Default initial load to prefer_images=false to avoid empty lists
      if (!params.has('prefer_images')) params.append('prefer_images', 'false');
      if (!params.has('limit')) params.append('limit', '20');
      if (!params.has('offset')) params.append('offset', '0');
      
      const response = await fetch(`${API_ENDPOINTS.RSS.ARTICLES}?${params}`, {
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchEnhancedSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.RSS.ENHANCED_SOURCES, {
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enhanced RSS sources');
      }

      const data = await response.json();
      setSources(data);
    } catch (err) {
      console.error('Error fetching enhanced sources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enhanced sources');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnhancedArticles = async () => {
    try {
      setArticlesLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedSource) params.append('source_id', selectedSource.toString());
      
      const response = await fetch(`${API_ENDPOINTS.RSS.ENHANCED_ARTICLES}?${params}`, {
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enhanced articles');
      }
      
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      console.error('Error fetching enhanced articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enhanced articles');
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleSourceEdit = (source: EnhancedRSSSource) => {
    setEditingSource(source);
    setShowSourceModal(true);
  };

  const handleSourceDelete = async (sourceId: number) => {
    if (!confirm('Are you sure you want to delete this RSS source?')) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.RSS.SOURCES}/${sourceId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete RSS source');
      }
      
      setSources(sources.filter(s => s.id !== sourceId));
    } catch (err) {
      console.error('Error deleting source:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete source');
    }
  };

  const handleSourceTest = async (sourceId: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RSS.SOURCES}/${sourceId}/test`, {
        method: 'POST',
        headers: await getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to test RSS source');
      }
      
      // Refresh sources after test
      await fetchSources();
    } catch (err) {
      console.error('Error testing source:', err);
      setError(err instanceof Error ? err.message : 'Failed to test source');
    }
  };

  const handleSourceRefresh = async (sourceId: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RSS.SOURCES}/${sourceId}/refresh`, {
        method: 'POST',
        headers: await getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh RSS source');
      }
      
      // Refresh sources after refresh
      await fetchSources();
    } catch (err) {
      console.error('Error refreshing source:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh source');
    }
  };

  const handleArticleRead = (article: EnhancedArticle) => {
    window.open(article.url, '_blank');
  };

  const handleArticleShare = (article: EnhancedArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: article.url
      });
    } else {
      navigator.clipboard.writeText(article.url);
    }
  };

  const handleArticleEmail = (article: EnhancedArticle) => {
    const subject = encodeURIComponent(article.title);
    const body = encodeURIComponent(`${article.summary}\n\nRead more: ${article.url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleLoadMore = () => {
    // Implement pagination
    fetchArticles();
  };

  const handleSourceFilter = (sourceId?: number) => {
    setSelectedSource(sourceId);
    fetchArticles();
  };

  const applyContentFilters = (filters: ContentFilter) => {
    setContentFilters(filters);
    // Apply filters to articles
    fetchArticles();
  };

  const convertToContentFilter = (filters: any) => {
    return {
      categories: filters.categories || [],
      tags: filters.tags || [],
      quality_range: filters.quality_range || [0, 1],
      sentiment_range: filters.sentiment_range || [-1, 1],
      word_count_range: filters.word_count_range || [0, 10000],
      date_range: {
        start: filters.date_range?.start || null,
        end: filters.date_range?.end || null
      },
      has_images: filters.has_images ?? undefined,
      has_quotes: filters.has_quotes ?? undefined,
      has_lists: filters.has_lists ?? undefined,
      has_urls: filters.has_urls ?? undefined
    };
  };

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));

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
                RSS Feeds
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your RSS sources and discover trending content
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('sources')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'sources'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sources
                </button>
                <button
                  onClick={() => setViewMode('articles')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'articles'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Articles
                </button>
              </div>
              
              <button
                onClick={() => setShowSourceModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Source
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search sources or articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <RssIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowContentFilter(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                </button>
                
                {viewMode === 'sources' && (
                  <button
                    onClick={() => setShowEnhancedView(!showEnhancedView)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ViewColumnsIcon className="h-4 w-4 mr-2" />
                    {showEnhancedView ? 'Simple View' : 'Enhanced View'}
                  </button>
                )}
              
              <button
                onClick={() => setShowStats(!showStats)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </button>
                
              <button
                onClick={() => setShowContentInsights(!showContentInsights)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                {showContentInsights ? 'Hide Insights' : 'Content Insights'}
              </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          {showStats && (
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
              <RSSStats sources={sources} articles={articles} />
          </motion.div>
        )}

          {/* Content Insights */}
        {showContentInsights && (
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
              <ContentInsights articles={articles} />
          </motion.div>
        )}

          {/* Content */}
          {viewMode === 'sources' ? (
            showEnhancedView ? (
              <EnhancedRSSSourceList
                sources={filteredSources}
                loading={loading}
                error={error}
                onEdit={handleSourceEdit}
                onDelete={handleSourceDelete}
                onTest={handleSourceTest}
                onRefresh={handleSourceRefresh}
              />
            ) : (
              <RSSSourceList
                sources={filteredSources}
                loading={loading}
                error={error}
                onEdit={handleSourceEdit}
                onDelete={handleSourceDelete}
                onTest={handleSourceTest}
                onRefresh={handleSourceRefresh}
              />
            )
          ) : (
            <ArticlesGrid
              articles={articles}
              loading={articlesLoading}
              onRead={handleArticleRead}
              onShare={handleArticleShare}
              onEmail={handleArticleEmail}
              onLoadMore={handleLoadMore}
              hasMore={articles.length > 0}
              selectedSource={selectedSource}
              onSourceFilter={handleSourceFilter}
            />
          )}
        </div>
      </div>

        {/* Modals */}
      {showSourceModal && (
          <RSSSourceModal
          isOpen={showSourceModal}
          onClose={() => {
            setShowSourceModal(false);
            setEditingSource(null);
          }}
          onSave={async (sourceData) => {
            try {
              const response = await fetch(
                editingSource 
                  ? `${API_ENDPOINTS.RSS.SOURCES}/${editingSource.id}`
                  : API_ENDPOINTS.RSS.SOURCES,
                {
                  method: editingSource ? 'PUT' : 'POST',
                  headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(sourceData)
                }
              );
              
              if (!response.ok) {
                throw new Error('Failed to save RSS source');
              }
              
              await fetchSources();
              setShowSourceModal(false);
              setEditingSource(null);
            } catch (err) {
              console.error('Error saving source:', err);
              setError(err instanceof Error ? err.message : 'Failed to save source');
            }
          }}
          source={editingSource}
        />
      )}

      {showContentFilter && (
        <AdvancedContentFilter
          isOpen={showContentFilter}
          onClose={() => setShowContentFilter(false)}
          onApply={(filters) => applyContentFilters(convertToContentFilter(filters))}
          initialFilters={convertToContentFilter(contentFilters)}
        />
      )}
    </div>
  );
}