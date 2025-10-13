"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  Search, 
  TrendingUp, 
  Star, 
  Clock, 
  Tag, 
  Globe,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Settings,
  BarChart3
} from 'lucide-react';

interface ContentFilter {
  categories?: string[];
  subcategories?: string[];
  quality_levels?: string[];
  sentiment_types?: string[];
  min_word_count?: number;
  max_word_count?: number;
  min_readability_score?: number;
  max_readability_score?: number;
  min_quality_score?: number;
  max_quality_score?: number;
  min_sentiment?: number;
  max_sentiment?: number;
  date_from?: string;
  date_to?: string;
  has_images?: boolean;
  has_quotes?: boolean;
  has_lists?: boolean;
  has_urls?: boolean;
  languages?: string[];
  source_ids?: number[];
  exclude_duplicates?: boolean;
  exclude_used?: boolean;
  only_recent?: boolean;
  tags?: string[];
  keywords?: string[];
  topics?: string[];
  min_sentence_count?: number;
  max_sentence_count?: number;
  min_paragraph_count?: number;
}

interface FilterPreset {
  id: number;
  name: string;
  description: string;
  filters: ContentFilter;
  is_default: boolean;
}

interface AdvancedContentFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ContentFilter) => void;
  onSavePreset?: (preset: Omit<FilterPreset, 'id'>) => void;
  presets?: FilterPreset[];
  initialFilters?: ContentFilter;
}

const CATEGORIES = [
  { value: 'technology', label: 'Technology', color: 'bg-blue-100 text-blue-800' },
  { value: 'business', label: 'Business', color: 'bg-green-100 text-green-800' },
  { value: 'science', label: 'Science', color: 'bg-purple-100 text-purple-800' },
  { value: 'health', label: 'Health', color: 'bg-red-100 text-red-800' },
  { value: 'politics', label: 'Politics', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'environment', label: 'Environment', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'sports', label: 'Sports', color: 'bg-orange-100 text-orange-800' },
  { value: 'entertainment', label: 'Entertainment', color: 'bg-pink-100 text-pink-800' }
];

const QUALITY_LEVELS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800' },
  { value: 'very_good', label: 'Very Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'good', label: 'Good', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'fair', label: 'Fair', color: 'bg-orange-100 text-orange-800' },
  { value: 'poor', label: 'Poor', color: 'bg-red-100 text-red-800' }
];

const SENTIMENT_TYPES = [
  { value: 'very_positive', label: 'Very Positive', color: 'bg-green-100 text-green-800' },
  { value: 'positive', label: 'Positive', color: 'bg-blue-100 text-blue-800' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-100 text-gray-800' },
  { value: 'negative', label: 'Negative', color: 'bg-orange-100 text-orange-800' },
  { value: 'very_negative', label: 'Very Negative', color: 'bg-red-100 text-red-800' }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' }
];

export default function AdvancedContentFilter({
  isOpen,
  onClose,
  onApply,
  onSavePreset,
  presets = [],
  initialFilters = {}
}: AdvancedContentFilterProps) {
  const [filters, setFilters] = useState<ContentFilter>(initialFilters);
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const updateFilter = (key: keyof ContentFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({
        name: presetName.trim(),
        description: presetDescription.trim(),
        filters,
        is_default: false
      });
      setPresetName('');
      setPresetDescription('');
      setShowSavePreset(false);
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const tabs = [
    { id: 'basic', label: 'Basic', icon: Filter },
    { id: 'content', label: 'Content', icon: Search },
    { id: 'quality', label: 'Quality', icon: Star },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-purple-600" />
              Advanced Content Filter
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Basic Filters Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {CATEGORIES.map((category) => (
                      <label
                        key={category.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.categories?.includes(category.value) || false}
                          onChange={(e) => {
                            const categories = filters.categories || [];
                            if (e.target.checked) {
                              updateFilter('categories', [...categories, category.value]);
                            } else {
                              updateFilter('categories', categories.filter(c => c !== category.value));
                            }
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                          {category.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quality Levels */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Quality Levels</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {QUALITY_LEVELS.map((level) => (
                      <label
                        key={level.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.quality_levels?.includes(level.value) || false}
                          onChange={(e) => {
                            const levels = filters.quality_levels || [];
                            if (e.target.checked) {
                              updateFilter('quality_levels', [...levels, level.value]);
                            } else {
                              updateFilter('quality_levels', levels.filter(l => l !== level.value));
                            }
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.color}`}>
                          {level.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sentiment Types */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Sentiment</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {SENTIMENT_TYPES.map((sentiment) => (
                      <label
                        key={sentiment.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.sentiment_types?.includes(sentiment.value) || false}
                          onChange={(e) => {
                            const sentiments = filters.sentiment_types || [];
                            if (e.target.checked) {
                              updateFilter('sentiment_types', [...sentiments, sentiment.value]);
                            } else {
                              updateFilter('sentiment_types', sentiments.filter(s => s !== sentiment.value));
                            }
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sentiment.color}`}>
                          {sentiment.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content Filters Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Word Count Range */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Word Count</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Words
                      </label>
                      <input
                        type="number"
                        value={filters.min_word_count || ''}
                        onChange={(e) => updateFilter('min_word_count', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Words
                      </label>
                      <input
                        type="number"
                        value={filters.max_word_count || ''}
                        onChange={(e) => updateFilter('max_word_count', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 1500"
                      />
                    </div>
                  </div>
                </div>

                {/* Readability Score Range */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Readability Score</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.min_readability_score || ''}
                        onChange={(e) => updateFilter('min_readability_score', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.max_readability_score || ''}
                        onChange={(e) => updateFilter('max_readability_score', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 90"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Date Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={filters.date_from || ''}
                        onChange={(e) => updateFilter('date_from', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={filters.date_to || ''}
                        onChange={(e) => updateFilter('date_to', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Characteristics */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Content Characteristics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.has_images || false}
                        onChange={(e) => updateFilter('has_images', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Has Images</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.has_quotes || false}
                        onChange={(e) => updateFilter('has_quotes', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Has Quotes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.has_lists || false}
                        onChange={(e) => updateFilter('has_lists', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Has Lists</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.has_urls || false}
                        onChange={(e) => updateFilter('has_urls', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Has URLs</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Filters Tab */}
            {activeTab === 'quality' && (
              <div className="space-y-6">
                {/* Quality Score Range */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Quality Score</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={filters.min_quality_score || ''}
                        onChange={(e) => updateFilter('min_quality_score', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={filters.max_quality_score || ''}
                        onChange={(e) => updateFilter('max_quality_score', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 1.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Sentiment Score Range */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Sentiment Score</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Sentiment
                      </label>
                      <input
                        type="number"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={filters.min_sentiment || ''}
                        onChange={(e) => updateFilter('min_sentiment', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., -0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Sentiment
                      </label>
                      <input
                        type="number"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={filters.max_sentiment || ''}
                        onChange={(e) => updateFilter('max_sentiment', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Structure */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Content Structure</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Sentences
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={filters.min_sentence_count || ''}
                        onChange={(e) => updateFilter('min_sentence_count', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Paragraphs
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={filters.min_paragraph_count || ''}
                        onChange={(e) => updateFilter('min_paragraph_count', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Filters Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* Languages */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Languages</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {LANGUAGES.map((lang) => (
                      <label
                        key={lang.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.languages?.includes(lang.value) || false}
                          onChange={(e) => {
                            const languages = filters.languages || [];
                            if (e.target.checked) {
                              updateFilter('languages', [...languages, lang.value]);
                            } else {
                              updateFilter('languages', languages.filter(l => l !== lang.value));
                            }
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{lang.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                  <input
                    type="text"
                    placeholder="Enter tags separated by commas"
                    value={filters.tags?.join(', ') || ''}
                    onChange={(e) => updateFilter('tags', e.target.value ? e.target.value.split(',').map(t => t.trim()).filter(Boolean) : [])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Keywords</h3>
                  <input
                    type="text"
                    placeholder="Enter keywords separated by commas"
                    value={filters.keywords?.join(', ') || ''}
                    onChange={(e) => updateFilter('keywords', e.target.value ? e.target.value.split(',').map(k => k.trim()).filter(Boolean) : [])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Topics */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Topics</h3>
                  <input
                    type="text"
                    placeholder="Enter topics separated by commas"
                    value={filters.topics?.join(', ') || ''}
                    onChange={(e) => updateFilter('topics', e.target.value ? e.target.value.split(',').map(t => t.trim()).filter(Boolean) : [])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Status Options */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Status Options</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.exclude_duplicates || false}
                        onChange={(e) => updateFilter('exclude_duplicates', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Exclude Duplicates</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.exclude_used || false}
                        onChange={(e) => updateFilter('exclude_used', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Exclude Used in Newsletters</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.only_recent || false}
                        onChange={(e) => updateFilter('only_recent', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Only Recent (24 hours)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Presets Section */}
            {presets.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Saved Presets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{preset.name}</h4>
                          <p className="text-sm text-gray-500">{preset.description}</p>
                        </div>
                        {preset.is_default && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Preset Modal */}
            {showSavePreset && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Save Filter Preset</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSavePreset}
                      disabled={!presetName.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Preset
                    </button>
                    <button
                      onClick={() => setShowSavePreset(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              {onSavePreset && (
                <button
                  onClick={() => setShowSavePreset(!showSavePreset)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preset
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
