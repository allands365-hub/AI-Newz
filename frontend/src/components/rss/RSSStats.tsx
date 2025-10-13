"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Globe, 
  FileText, 
  TrendingUp,
  Calendar,
  Star,
  Activity
} from 'lucide-react';

interface RSSStats {
  total_sources: number;
  active_sources: number;
  total_articles: number;
  articles_today: number;
  articles_this_week: number;
  top_categories: Array<{ category: string; count: number }>;
  recent_sources: Array<{
    id: number;
    name: string;
    url: string;
    last_fetched?: string;
  }>;
  quality_distribution: Record<string, number>;
}

interface RSSStatsProps {
  sources: any[];
  articles: any[];
}

export default function RSSStats({ sources, articles }: RSSStatsProps) {
  // Calculate stats from sources and articles
  const stats = {
    total_sources: sources.length,
    active_sources: sources.filter(s => s.is_active).length,
    total_articles: articles.length,
    articles_today: articles.filter(a => {
      const today = new Date();
      const articleDate = new Date(a.published_at || a.fetched_at);
      return articleDate.toDateString() === today.toDateString();
    }).length,
    articles_this_week: articles.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const articleDate = new Date(a.published_at || a.fetched_at);
      return articleDate >= weekAgo;
    }).length,
    top_categories: Object.entries(
      articles.reduce((acc, article) => {
        const category = article.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    recent_sources: sources
      .filter(s => s.last_fetched)
      .sort((a, b) => new Date(b.last_fetched).getTime() - new Date(a.last_fetched).getTime())
      .slice(0, 3),
    quality_distribution: {
      'excellent': articles.filter(a => a.quality_score >= 0.9).length,
      'very good': articles.filter(a => a.quality_score >= 0.8 && a.quality_score < 0.9).length,
      'good': articles.filter(a => a.quality_score >= 0.7 && a.quality_score < 0.8).length,
      'fair': articles.filter(a => a.quality_score >= 0.6 && a.quality_score < 0.7).length,
      'poor': articles.filter(a => a.quality_score < 0.6).length,
    }
  };
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'very good': return 'text-blue-600 bg-blue-100';
      case 'good': return 'text-yellow-600 bg-yellow-100';
      case 'fair': return 'text-orange-600 bg-orange-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const statsCards = [
    {
      title: 'Total Sources',
      value: stats.total_sources,
      icon: Globe,
      color: 'text-blue-600 bg-blue-100',
      change: null
    },
    {
      title: 'Active Sources',
      value: stats.active_sources,
      icon: Activity,
      color: 'text-green-600 bg-green-100',
      change: stats.total_sources > 0 ? `${Math.round((stats.active_sources / stats.total_sources) * 100)}%` : '0%'
    },
    {
      title: 'Total Articles',
      value: stats.total_articles,
      icon: FileText,
      color: 'text-purple-600 bg-purple-100',
      change: null
    },
    {
      title: 'Articles Today',
      value: stats.articles_today,
      icon: Calendar,
      color: 'text-indigo-600 bg-indigo-100',
      change: null
    },
    {
      title: 'This Week',
      value: stats.articles_this_week,
      icon: TrendingUp,
      color: 'text-pink-600 bg-pink-100',
      change: null
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
          RSS Statistics
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(card.value)}</p>
                {card.change && (
                  <p className="text-xs text-gray-500 mt-1">{card.change} active</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            Top Categories
          </h4>
          <div className="space-y-3">
            {stats.top_categories.slice(0, 5).map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {category.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (category.count / Math.max(...stats.top_categories.map(c => c.count))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {formatNumber(category.count)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quality Distribution */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-green-500" />
            Content Quality
          </h4>
          <div className="space-y-3">
            {Object.entries(stats.quality_distribution).map(([quality, count], index) => (
              <motion.div
                key={quality}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getQualityColor(quality).split(' ')[1]}`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {quality}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getQualityColor(quality).split(' ')[1]}`}
                      style={{ 
                        width: `${Math.min(100, (count / Math.max(...Object.values(stats.quality_distribution))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {formatNumber(count)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sources */}
      {stats.recent_sources.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-blue-500" />
            Recent Activity
          </h4>
          <div className="space-y-2">
            {stats.recent_sources.slice(0, 3).map((source, index) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{source.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{source.url}</p>
                  </div>
                </div>
                {source.last_fetched && (
                  <span className="text-xs text-gray-500">
                    {new Date(source.last_fetched).toLocaleDateString()}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
