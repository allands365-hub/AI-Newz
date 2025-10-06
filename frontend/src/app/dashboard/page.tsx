'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CogIcon,
  UserCircleIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, handleLogout, requireAuth, isLoading } = useAuth();

  // Require authentication
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = [
    { name: 'Newsletters', value: '12', icon: DocumentTextIcon, change: '+2', changeType: 'positive' },
    { name: 'Subscribers', value: '2,341', icon: UserCircleIcon, change: '+12%', changeType: 'positive' },
    { name: 'Open Rate', value: '68%', icon: ChartBarIcon, change: '+5%', changeType: 'positive' },
    { name: 'Click Rate', value: '12.4%', icon: ChartBarIcon, change: '+2%', changeType: 'positive' },
  ];

  const recentNewsletters = [
    { id: 1, title: 'Weekly Tech Roundup', status: 'sent', sentAt: '2 hours ago', openRate: '68%' },
    { id: 2, title: 'AI Trends Report', status: 'draft', sentAt: null, openRate: null },
    { id: 3, title: 'Startup Funding News', status: 'sent', sentAt: '1 day ago', openRate: '72%' },
  ];

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
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentNewsletters.map((newsletter) => (
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
                            {newsletter.status === 'sent' 
                              ? `Sent ${newsletter.sentAt}` 
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
                            newsletter.status === 'sent' 
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
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
