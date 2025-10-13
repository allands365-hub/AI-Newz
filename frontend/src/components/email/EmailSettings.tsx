'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

interface EmailSettingsProps {
  newsletterId?: string;
  onClose?: () => void;
}

export default function EmailSettings({ newsletterId, onClose }: EmailSettingsProps) {
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Set default delivery time to next 08:00
    const now = new Date();
    const next8AM = new Date(now);
    next8AM.setHours(8, 0, 0, 0);
    
    // If it's already past 8 AM today, set for tomorrow
    if (now.getHours() >= 8) {
      next8AM.setDate(next8AM.getDate() + 1);
    }
    
    setDeliveryTime(next8AM.toISOString().slice(0, 16));
  }, []);

  const handleSendNow = async () => {
    if (!newsletterId) return;
    
    setIsSending(true);
    setMessage(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_ENDPOINTS.EMAIL.SEND_NEWSLETTER}?newsletter_id=${newsletterId}`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Newsletter sent successfully!' });
        if (onClose) onClose();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to send newsletter' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!newsletterId || !deliveryTime) return;
    
    setIsScheduling(true);
    setMessage(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_ENDPOINTS.EMAIL.SCHEDULE_NEWSLETTER}?newsletter_id=${newsletterId}&delivery_time=${deliveryTime}`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Newsletter scheduled successfully!' });
        if (onClose) onClose();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to schedule newsletter' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleScheduleDaily = async () => {
    setIsScheduling(true);
    setMessage(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINTS.EMAIL.SCHEDULE_DAILY, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Daily digest scheduled for ${new Date(result.delivery_time).toLocaleString()}` 
        });
        if (onClose) onClose();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to schedule daily digest' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setMessage(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINTS.EMAIL.TEST_EMAIL, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test email sent! Check your inbox.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to send test email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <EnvelopeIcon className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Email Delivery</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Send Now */}
        {newsletterId && (
          <button
            onClick={handleSendNow}
            disabled={isSending}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            {isSending ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <EnvelopeIcon className="h-4 w-4" />
            )}
            <span>{isSending ? 'Sending...' : 'Send Now'}</span>
          </button>
        )}

        {/* Schedule Newsletter */}
        {newsletterId && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Schedule Delivery
            </label>
            <input
              type="datetime-local"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={handleSchedule}
              disabled={isScheduling || !deliveryTime}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
            >
              {isScheduling ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ClockIcon className="h-4 w-4" />
              )}
              <span>{isScheduling ? 'Scheduling...' : 'Schedule'}</span>
            </button>
          </div>
        )}

        {/* Schedule Daily Digest */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Automation</h4>
          <button
            onClick={handleScheduleDaily}
            disabled={isScheduling}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            {isScheduling ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ClockIcon className="h-4 w-4" />
            )}
            <span>{isScheduling ? 'Scheduling...' : 'Schedule Daily Digest'}</span>
          </button>
        </div>

        {/* Test Email */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Email Testing</h4>
          <button
            onClick={handleTestEmail}
            disabled={isTesting}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            {isTesting ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <EnvelopeIcon className="h-4 w-4" />
            )}
            <span>{isTesting ? 'Sending...' : 'Send Test Email'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
