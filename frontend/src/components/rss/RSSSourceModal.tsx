"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Globe, 
  Tag, 
  Clock, 
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface RSSSource {
  id?: number;
  name: string;
  url: string;
  description?: string;
  category?: string;
  language: string;
  is_active?: boolean;
  credibility_score?: number;
  fetch_frequency?: number;
}

interface RSSSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<RSSSource>) => Promise<void>;
  title: string;
  initialData?: RSSSource;
}

const CATEGORIES = [
  'technology',
  'business',
  'science',
  'health',
  'politics',
  'sports',
  'entertainment',
  'world',
  'general'
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

export default function RSSSourceModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData
}: RSSSourceModalProps) {
  const [formData, setFormData] = useState<RSSSource>({
    name: '',
    url: '',
    description: '',
    category: '',
    language: 'en',
    is_active: true,
    credibility_score: 0.5,
    fetch_frequency: 3600
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string } | null>(null);

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          name: '',
          url: '',
          description: '',
          category: '',
          language: 'en',
          is_active: true,
          credibility_score: 0.5,
          fetch_frequency: 3600
        });
      }
      setErrors({});
      setUrlValidation(null);
    }
  }, [isOpen, initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    if (formData.credibility_score !== undefined && (formData.credibility_score < 0 || formData.credibility_score > 1)) {
      newErrors.credibility_score = 'Credibility score must be between 0 and 1';
    }

    if (formData.fetch_frequency !== undefined && formData.fetch_frequency < 300) {
      newErrors.fetch_frequency = 'Fetch frequency must be at least 5 minutes (300 seconds)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUrl = async (url: string) => {
    if (!url) return;

    setIsValidatingUrl(true);
    try {
      // Basic URL validation
      new URL(url);
      
      // You could add more sophisticated validation here
      // like checking if the URL returns a valid RSS feed
      setUrlValidation({ isValid: true, message: 'URL appears valid' });
    } catch {
      setUrlValidation({ isValid: false, message: 'Invalid URL format' });
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit:', error);
      // You could show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RSSSource, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validate URL when it changes
    if (field === 'url') {
      validateUrl(value);
    }
  };

  const formatFetchFrequency = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

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
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., TechCrunch"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSS Feed URL *
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.url ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/feed.xml"
                />
                <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.url && (
                <p className="mt-1 text-sm text-red-600">{errors.url}</p>
              )}
              {urlValidation && (
                <div className={`mt-1 flex items-center text-sm ${
                  urlValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isValidatingUrl ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                  ) : urlValidation.isValid ? (
                    <CheckCircle className="w-3 h-3 mr-2" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-2" />
                  )}
                  {urlValidation.message}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Brief description of this RSS source..."
              />
            </div>

            {/* Category and Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Credibility Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credibility Score: {(formData.credibility_score! * 100).toFixed(0)}%
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.credibility_score}
                  onChange={(e) => handleInputChange('credibility_score', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Star className="w-4 h-4" />
                  <span>{formData.credibility_score! >= 0.8 ? 'High' : formData.credibility_score! >= 0.6 ? 'Medium' : 'Low'}</span>
                </div>
              </div>
              {errors.credibility_score && (
                <p className="mt-1 text-sm text-red-600">{errors.credibility_score}</p>
              )}
            </div>

            {/* Fetch Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fetch Frequency: {formatFetchFrequency(formData.fetch_frequency!)}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="300"
                  max="86400"
                  step="300"
                  value={formData.fetch_frequency}
                  onChange={(e) => handleInputChange('fetch_frequency', parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Every {formatFetchFrequency(formData.fetch_frequency!)}</span>
                </div>
              </div>
              {errors.fetch_frequency && (
                <p className="mt-1 text-sm text-red-600">{errors.fetch_frequency}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active (enable automatic fetching)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Source'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
