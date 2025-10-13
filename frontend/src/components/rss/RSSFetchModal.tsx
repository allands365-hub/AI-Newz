"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Globe,
  Clock,
  FileText
} from 'lucide-react';

interface RSSSource {
  id: number;
  name: string;
  url: string;
  category?: string;
  is_active: boolean;
  last_fetched?: string;
}

interface FetchResult {
  success: boolean;
  message: string;
  sources_processed: number;
  articles_fetched: number;
  articles_processed: number;
  duplicates_found: number;
  errors: string[];
}

interface RSSFetchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFetch: (sourceIds?: number[], forceRefresh?: boolean) => Promise<FetchResult>;
  sources: RSSSource[];
}

export default function RSSFetchModal({
  isOpen,
  onClose,
  onFetch,
  sources
}: RSSFetchModalProps) {
  const [selectedSources, setSelectedSources] = useState<Set<number>>(new Set());
  const [forceRefresh, setForceRefresh] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const activeSources = sources.filter(source => source.is_active);

  const handleSourceToggle = (sourceId: number) => {
    setSelectedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedSources.size === activeSources.length) {
      setSelectedSources(new Set());
    } else {
      setSelectedSources(new Set(activeSources.map(source => source.id)));
    }
  };

  const handleFetch = async () => {
    setIsFetching(true);
    setFetchResult(null);
    setFetchError(null);

    try {
      const sourceIds = selectedSources.size > 0 ? Array.from(selectedSources) : undefined;
      const result = await onFetch(sourceIds, forceRefresh);
      setFetchResult(result);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch RSS feeds');
    } finally {
      setIsFetching(false);
    }
  };

  const handleClose = () => {
    setSelectedSources(new Set());
    setForceRefresh(false);
    setFetchResult(null);
    setFetchError(null);
    onClose();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-purple-600" />
              Fetch RSS Feeds
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {!fetchResult && !fetchError ? (
              <>
                {/* Source Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Select Sources</h3>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedSources.size === activeSources.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {activeSources.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No active RSS sources found</p>
                      <p className="text-sm">Add some RSS sources first to fetch content</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {activeSources.map((source) => (
                        <label
                          key={source.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSources.has(source.id)}
                            onChange={() => handleSourceToggle(source.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {source.name}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatLastFetched(source.last_fetched)}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{source.url}</p>
                            {source.category && (
                              <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {source.category}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Options</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="force_refresh"
                      checked={forceRefresh}
                      onChange={(e) => setForceRefresh(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="force_refresh" className="ml-2 block text-sm text-gray-700">
                      Force refresh (ignore last fetch time)
                    </label>
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Fetch Summary</h4>
                  <div className="text-sm text-gray-600">
                    <p>
                      {selectedSources.size === 0 
                        ? `Will fetch from all ${activeSources.length} active sources`
                        : `Will fetch from ${selectedSources.size} selected source${selectedSources.size === 1 ? '' : 's'}`
                      }
                    </p>
                    {forceRefresh && (
                      <p className="text-purple-600 mt-1">Force refresh enabled</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFetch}
                    disabled={isFetching || activeSources.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isFetching ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Start Fetch
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Results */
              <div>
                {fetchResult ? (
                  <div className="text-center">
                    <div className="mb-4">
                      {fetchResult.success ? (
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      ) : (
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      )}
                    </div>

                    <h3 className={`text-lg font-semibold mb-2 ${
                      fetchResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {fetchResult.success ? 'Fetch Completed!' : 'Fetch Failed'}
                    </h3>

                    <p className="text-gray-600 mb-6">{fetchResult.message}</p>

                    {fetchResult.success && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {fetchResult.sources_processed}
                          </div>
                          <div className="text-sm text-blue-800">Sources</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-600">
                            {fetchResult.articles_fetched}
                          </div>
                          <div className="text-sm text-green-800">Fetched</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-purple-600">
                            {fetchResult.articles_processed}
                          </div>
                          <div className="text-sm text-purple-800">Processed</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-orange-600">
                            {fetchResult.duplicates_found}
                          </div>
                          <div className="text-sm text-orange-800">Duplicates</div>
                        </div>
                      </div>
                    )}

                    {fetchResult.errors.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                        <div className="space-y-1">
                          {fetchResult.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleClose}
                      className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Fetch Error</h3>
                    <p className="text-gray-600 mb-6">{fetchError}</p>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
