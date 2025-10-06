'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  SparklesIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, requireGuest } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    requireGuest();
  }, [requireGuest]);

  const features = [
    {
      name: 'Smart Aggregation',
      description: 'Automatically collect content from your trusted sources',
      icon: DocumentTextIcon,
    },
    {
      name: 'AI Generation',
      description: 'Generate professional newsletters in your unique voice',
      icon: SparklesIcon,
    },
    {
      name: 'Trend Detection',
      description: 'Stay ahead with emerging trends and insights',
      icon: ChartBarIcon,
    },
    {
      name: 'Time Saving',
      description: 'Reduce newsletter creation time from hours to minutes',
      icon: ClockIcon,
    },
    {
      name: 'Engagement Boost',
      description: 'Improve open rates and subscriber engagement',
      icon: UserGroupIcon,
    },
  ];

  const stats = [
    { name: 'Newsletter Creation Time', value: '< 20 minutes', change: 'From 2-3 hours' },
    { name: 'Draft Acceptance Rate', value: '70%+', change: 'Industry leading' },
    { name: 'User Engagement', value: '60%+', change: 'Improvement rate' },
  ];

  const handleGoogleSuccess = (user: any) => {
    console.log('Google Sign-In successful:', user);
  };

  const handleGoogleError = (error: any) => {
    console.error('Google Sign-In error:', error);
  };

  return (
    <div className="min-h-screen bg-icy-gradient">
      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-icy-gradient-strong rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">AN</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AI-Newz</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex space-x-8"
          >
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex space-x-4"
          >
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-icy-gradient-strong text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold text-secondary-900 mb-6"
          >
            Turn Hours of Research Into{' '}
            <span className="bg-icy-gradient-strong bg-clip-text text-transparent">Minutes of Content</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-secondary-700 mb-8 max-w-2xl mx-auto"
          >
            AI-powered newsletter creation that aggregates trusted sources, 
            detects trends, and generates ready-to-send content in under 20 minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <GoogleSignIn
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              className="max-w-sm mx-auto"
            />
            <Link
              href="/demo"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Watch Demo
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 mb-1">{stat.name}</div>
                <div className="text-xs text-gray-500">{stat.change}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-16 bg-icy-gradient-soft">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to create amazing newsletters
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform handles the heavy lifting so you can focus on what matters most.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-primary-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-icy-gradient-soft rounded-lg mx-auto mb-4 flex items-center justify-center shadow-md">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-icy-gradient-strong">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Ready to revolutionize your newsletter creation?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-primary-100 mb-8"
          >
            Join thousands of creators who are already saving hours every week.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <GoogleSignIn
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              className="max-w-sm mx-auto"
            />
            <Link
              href="/auth/register"
              className="bg-white/90 text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center hover:scale-105"
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-secondary-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-icy-gradient-strong rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">AN</span>
            </div>
            <span className="text-xl font-bold text-white">AI-Newz</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 AI-Newz. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
