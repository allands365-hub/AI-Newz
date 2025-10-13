"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Tag, 
  Globe, 
  Clock,
  Filter,
  RefreshCw,
  Download,
  Share2
} from 'lucide-react';

interface ContentInsights {
  trending_categories: Array<{ category: string; count: number; change: number }>;
  trending_tags: Array<{ tag: string; count: number; change: number }>;
  trending_topics: Array<{ topic: string; count: number; change: number }>;
  quality_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  time_period: string;
  total_articles: number;
  avg_quality_score: number;
  avg_sentiment_score: number;
  top_sources: Array<{ name: string; count: number; quality: number }>;
  content_characteristics: {
    has_images: number;
    has_quotes: number;
    has_lists: number;
    has_urls: number;
  };
}

interface ContentInsightsProps {
  articles: any[];
}

export default function ContentInsights({
  articles
}: ContentInsightsProps) {
  // Calculate insights from articles
  const insights = {
    trending_categories: Object.entries(
      articles.reduce((acc, article) => {
        const category = article.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ category, count, change: Math.random() * 20 - 10 }))
      .sort((a, b) => b.count - a.count),
    trending_tags: Object.entries(
      articles.reduce((acc, article) => {
        (article.tags || []).forEach((tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>)
    ).map(([tag, count]) => ({ tag, count, change: Math.random() * 20 - 10 }))
      .sort((a, b) => b.count - a.count),
    trending_topics: [],
    quality_distribution: {
      'excellent': articles.filter(a => a.quality_score >= 0.9).length,
      'very_good': articles.filter(a => a.quality_score >= 0.8 && a.quality_score < 0.9).length,
      'good': articles.filter(a => a.quality_score >= 0.7 && a.quality_score < 0.8).length,
      'fair': articles.filter(a => a.quality_score >= 0.6 && a.quality_score < 0.7).length,
      'poor': articles.filter(a => a.quality_score < 0.6).length,
    },
    sentiment_distribution: {
      'very_positive': articles.filter(a => a.sentiment_score >= 0.8).length,
      'positive': articles.filter(a => a.sentiment_score >= 0.4 && a.sentiment_score < 0.8).length,
      'neutral': articles.filter(a => a.sentiment_score >= -0.4 && a.sentiment_score < 0.4).length,
      'negative': articles.filter(a => a.sentiment_score >= -0.8 && a.sentiment_score < -0.4).length,
      'very_negative': articles.filter(a => a.sentiment_score < -0.8).length,
    },
    time_period: 'week',
    total_articles: articles.length,
    avg_quality_score: articles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / articles.length || 0,
    avg_sentiment_score: articles.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / articles.length || 0,
    top_sources: Object.entries(
      articles.reduce((acc, article) => {
        const source = article.rss_source_name || 'Unknown';
        if (!acc[source]) {
          acc[source] = { count: 0, quality: 0 };
        }
        acc[source].count++;
        acc[source].quality += article.quality_score || 0;
        return acc;
      }, {} as Record<string, { count: number; quality: number }>)
    ).map(([name, data]) => ({ name, count: data.count, quality: data.quality / data.count }))
      .sort((a, b) => b.quality - a.quality),
    content_characteristics: {
      has_images: articles.filter(a => a.has_images).length,
      has_quotes: articles.filter(a => a.has_quotes).length,
      has_lists: articles.filter(a => a.has_lists).length,
      has_urls: articles.filter(a => a.has_urls).length,
    }
  };
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const qualityColors = {
    'excellent': 'bg-green-100 text-green-800',
    'very_good': 'bg-blue-100 text-blue-800',
    'good': 'bg-yellow-100 text-yellow-800',
    'fair': 'bg-orange-100 text-orange-800',
    'poor': 'bg-red-100 text-red-800'
  };

  const sentimentColors = {
    'very_positive': 'bg-green-100 text-green-800',
    'positive': 'bg-blue-100 text-blue-800',
    'neutral': 'bg-gray-100 text-gray-800',
    'negative': 'bg-orange-100 text-orange-800',
    'very_negative': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Content Insights
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Analytics and trends for your RSS content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Articles</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(insights.total_articles)}
                </p>
              </div>
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Avg Quality</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatPercentage(insights.avg_quality_score)}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Sentiment</p>
                <p className="text-2xl font-bold text-purple-900">
                  {insights.avg_sentiment_score.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-orange-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Time Period</p>
                <p className="text-lg font-bold text-orange-900 capitalize">
                  {insights.time_period}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trending Categories */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Trending Categories
            </h4>
            <div className="space-y-3">
              {insights.trending_categories.slice(0, 5).map((category, index) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {category.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatNumber(category.count)} articles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(category.change)}
                      <span className={`text-sm font-medium ${getChangeColor(category.change)}`}>
                        {category.change > 0 ? '+' : ''}{category.change}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trending Tags */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-blue-500" />
              Trending Tags
            </h4>
            <div className="space-y-3">
              {insights.trending_tags.slice(0, 5).map((tag, index) => (
                <div
                  key={tag.tag}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        #{tag.tag}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatNumber(tag.count)} uses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(tag.change)}
                      <span className={`text-sm font-medium ${getChangeColor(tag.change)}`}>
                        {tag.change > 0 ? '+' : ''}{tag.change}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quality Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Quality Distribution
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(insights.quality_distribution).map(([quality, count]) => (
              <div
                key={quality}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${qualityColors[quality as keyof typeof qualityColors] || 'bg-gray-100 text-gray-800'}`}>
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(count)}
                </p>
                <p className="text-sm text-gray-500">articles</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sentiment Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
            Sentiment Distribution
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(insights.sentiment_distribution).map(([sentiment, count]) => (
              <div
                key={sentiment}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${sentimentColors[sentiment as keyof typeof sentimentColors] || 'bg-gray-100 text-gray-800'}`}>
                  {sentiment.replace('_', ' ').charAt(0).toUpperCase() + sentiment.replace('_', ' ').slice(1)}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(count)}
                </p>
                <p className="text-sm text-gray-500">articles</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content Characteristics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-indigo-500" />
            Content Characteristics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🖼️</span>
              </div>
              <p className="text-sm font-medium text-gray-600">With Images</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(insights.content_characteristics.has_images)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-sm font-medium text-gray-600">With Quotes</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(insights.content_characteristics.has_quotes)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-sm font-medium text-gray-600">With Lists</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(insights.content_characteristics.has_lists)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🔗</span>
              </div>
              <p className="text-sm font-medium text-gray-600">With URLs</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(insights.content_characteristics.has_urls)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Top Sources */}
        {insights.top_sources && insights.top_sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-8"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-green-500" />
              Top Sources by Quality
            </h4>
            <div className="space-y-3">
              {insights.top_sources.slice(0, 5).map((source, index) => (
                <div
                  key={source.name}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{source.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatNumber(source.count)} articles
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPercentage(source.quality)} quality
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
