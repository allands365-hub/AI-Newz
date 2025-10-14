'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CogIcon,
  UserCircleIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  total_newsletters: number;
  published_newsletters: number;
  draft_newsletters: number;
  total_subscribers: number;
  total_views: number;
  avg_open_rate: number;
  avg_click_rate: number;
  growth: {
    newsletters: string;
    subscribers: string;
    open_rate: string;
    click_rate: string;
  };
}

interface Newsletter {
  id: number;
  subject: string;
  status: string;
  created_at: string;
  published_at?: string;
  open_rate?: number;
  click_rate?: number;
  views_count?: number;
}

export default function DashboardPage() {
  const { user, handleLogout, requireAuth, isLoading } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentNewsletters, setRecentNewsletters] = useState<Newsletter[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Require authentication
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setDataLoading(true);
        setError(null);
        
        const headers = await getAuthHeaders();
        
        // Fetch analytics data
        const analyticsResponse = await fetch(API_ENDPOINTS.ANALYTICS.OVERVIEW, {
          headers
        });
        
        if (!analyticsResponse.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const analytics = await analyticsResponse.json();
        setAnalyticsData(analytics);
        
        // Fetch recent newsletters
        const newslettersResponse = await fetch(`${API_ENDPOINTS.NEWSLETTERS.LIST}?limit=5`, {
          headers
        });
        
        if (!newslettersResponse.ok) {
          throw new Error('Failed to fetch newsletters data');
        }
        
        const newsletters = await newslettersResponse.json();
        setRecentNewsletters(newsletters);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Create stats from real data or show defaults
  const stats = analyticsData ? [
    { 
      name: 'Newsletters', 
      value: analyticsData.total_newsletters.toString(), 
      icon: DocumentTextIcon, 
      change: analyticsData.growth.newsletters, 
      changeType: 'positive' 
    },
    { 
      name: 'Subscribers', 
      value: analyticsData.total_subscribers.toLocaleString(), 
      icon: UserCircleIcon, 
      change: analyticsData.growth.subscribers, 
      changeType: 'positive' 
    },
    { 
      name: 'Open Rate', 
      value: `${analyticsData.avg_open_rate.toFixed(1)}%`, 
      icon: ChartBarIcon, 
      change: analyticsData.growth.open_rate, 
      changeType: 'positive' 
    },
    { 
      name: 'Click Rate', 
      value: `${analyticsData.avg_click_rate.toFixed(1)}%`, 
      icon: ChartBarIcon, 
      change: analyticsData.growth.click_rate, 
      changeType: 'positive' 
    },
  ] : [
    { name: 'Newsletters', value: '0', icon: DocumentTextIcon, change: '+0', changeType: 'positive' },
    { name: 'Subscribers', value: '0', icon: UserCircleIcon, change: '+0%', changeType: 'positive' },
    { name: 'Open Rate', value: '0%', icon: ChartBarIcon, change: '+0%', changeType: 'positive' },
    { name: 'Click Rate', value: '0%', icon: ChartBarIcon, change: '+0%', changeType: 'positive' },
  ];

  // Format recent newsletters from real data
  const formatNewsletter = (newsletter: Newsletter) => {
    const sentAt = newsletter.published_at ? 
      new Date(newsletter.published_at).toLocaleDateString() : 
      null;
    const openRate = newsletter.open_rate ? 
      `${newsletter.open_rate.toFixed(1)}%` : 
      null;
    
    return {
      id: newsletter.id,
      title: newsletter.subject,
      status: newsletter.status,
      sentAt,
      openRate
    };
  };

  const formattedRecentNewsletters = recentNewsletters.map(formatNewsletter);

  return (
    <div className="min-h-screen bg-icy-gradient-soft">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">AI-Newz</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                {user.profile_picture ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.profile_picture}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h2>
            <p className="mt-2 text-gray-600">
              Ready to create your next AI-powered newsletter?
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white shadow rounded-lg mb-8"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 ring-4 ring-white">
                      <DocumentTextIcon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Create Newsletter
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Generate a new AI-powered newsletter
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </span>
                </button>

                <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 ring-4 ring-white">
                      <ChartBarIcon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      View Analytics
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Check your newsletter performance
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </span>
                </button>

                <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-600 ring-4 ring-white">
                      <CogIcon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Settings
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage your account preferences
                    </p>
                  </div>
                  <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Recent Newsletters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Newsletters
              </h3>
              <div className="flow-root">
                {error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">Failed to load newsletters: {error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-primary-600 hover:text-primary-500"
                    >
                      Try again
                    </button>
                  </div>
                ) : formattedRecentNewsletters.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No newsletters yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first newsletter.</p>
                  </div>
                ) : (
                  <ul className="-my-5 divide-y divide-gray-200">
                    {formattedRecentNewsletters.map((newsletter) => (
                      <li key={newsletter.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {newsletter.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {newsletter.status === 'published' 
                                ? `Published ${newsletter.sentAt}` 
                                : 'Draft'
                              }
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {newsletter.openRate && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {newsletter.openRate} open rate
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              newsletter.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {newsletter.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
