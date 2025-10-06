'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();

  // Require authentication
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const steps = [
    {
      title: 'Welcome to AI-Newz!',
      description: 'Let\'s get you set up to create amazing newsletters.',
      completed: true,
    },
    {
      title: 'Add Content Sources',
      description: 'Connect your favorite news sources and RSS feeds.',
      completed: false,
    },
    {
      title: 'Set Your Preferences',
      description: 'Customize your newsletter style and frequency.',
      completed: false,
    },
    {
      title: 'Create Your First Newsletter',
      description: 'Generate your first AI-powered newsletter.',
      completed: false,
    },
  ];

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-icy-gradient">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to AI-Newz, {user?.name?.split(' ')[0]}! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Let's get you set up to create amazing AI-powered newsletters.
          </p>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Get Started
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
          <p className="mt-4 text-sm text-gray-500">
            You can always come back to complete these steps later.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
