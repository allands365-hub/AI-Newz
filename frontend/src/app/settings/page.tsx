'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon,
  EnvelopeIcon,
  BellIcon,
  CogIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_picture: string;
  created_at: string;
  last_login: string;
}

interface EmailPreferences {
  daily_digest: boolean;
  newsletter_notifications: boolean;
  marketing_emails: boolean;
  delivery_time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

interface NewsletterPreferences {
  default_style: 'professional' | 'casual' | 'technical';
  default_length: 'short' | 'medium' | 'long';
  include_trends: boolean;
  include_summaries: boolean;
  auto_save_drafts: boolean;
  ai_model: 'llama-3.1-70b-versatile' | 'gpt-4' | 'claude-3';
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  newsletter_alerts: boolean;
  system_updates: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
    daily_digest: true,
    newsletter_notifications: true,
    marketing_emails: false,
    delivery_time: '08:00',
    frequency: 'daily'
  });
  const [newsletterPrefs, setNewsletterPrefs] = useState<NewsletterPreferences>({
    default_style: 'professional',
    default_length: 'medium',
    include_trends: true,
    include_summaries: true,
    auto_save_drafts: true,
    ai_model: 'llama-3.1-70b-versatile'
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    newsletter_alerts: true,
    system_updates: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = window.localStorage.getItem('theme');
    return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'appearance', name: 'Appearance', icon: CogIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'newsletter', name: 'Newsletter', icon: DocumentTextIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon }
  ];

  useEffect(() => {
    loadUserProfile();
    loadSettings();
  }, []);

  const loadUserProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINTS.AUTH.ME, { headers });
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadSettings = async () => {
    try {
      // Load email preferences
      const emailResponse = await fetch('/api/settings/email-preferences');
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        setEmailPrefs(emailData);
      }

      // Load newsletter preferences
      const newsletterResponse = await fetch('/api/settings/newsletter-preferences');
      if (newsletterResponse.ok) {
        const newsletterData = await newsletterResponse.json();
        setNewsletterPrefs(newsletterData);
      }

      // Load notification settings
      const notificationResponse = await fetch('/api/settings/notification-settings');
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        setNotificationSettings(notificationData);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (section: string, data: any) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/settings/${section}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!` });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || `Failed to save ${section} settings` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-200">Manage your account settings and preferences</p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-900' 
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-900'
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border border-primary-200 dark:bg-zinc-900 dark:text-primary-300 dark:border-primary-900/40'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800"
            >
              {activeTab === 'profile' && (
                <ProfileSettings 
                  userProfile={userProfile}
                  onSave={(data) => saveSettings('profile', data)}
                  isSaving={isSaving}
                />
              )}
              {activeTab === 'email' && (
                <EmailSettings 
                  emailPrefs={emailPrefs}
                  onSave={(data) => saveSettings('email-preferences', data)}
                  onTestEmail={handleTestEmail}
                  isSaving={isSaving}
                />
              )}
              {activeTab === 'appearance' && (
                <AppearanceSettings />
              )}
              {activeTab === 'newsletter' && (
                <NewsletterSettings 
                  newsletterPrefs={newsletterPrefs}
                  onSave={(data) => saveSettings('newsletter-preferences', data)}
                  isSaving={isSaving}
                />
              )}
              {activeTab === 'notifications' && (
                <NotificationSettings 
                  notificationSettings={notificationSettings}
                  onSave={(data) => saveSettings('notification-settings', data)}
                  isSaving={isSaving}
                />
              )}
              {activeTab === 'security' && (
                <SecuritySettings 
                  userProfile={userProfile}
                  onSave={(data) => saveSettings('security', data)}
                  isSaving={isSaving}
                />
              )}
              {activeTab === 'integrations' && (
                <IntegrationsSettings 
                  onSave={(data) => saveSettings('integrations', data)}
                  isSaving={isSaving}
                />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
// Appearance Settings Component
function AppearanceSettings() {
  const [value, setValue] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = window.localStorage.getItem('theme');
    return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
  });

  useEffect(() => {
    try { window.localStorage.setItem('theme', value); } catch {}
    // Toggle class on html (ThemeProvider also ensures this on mount/change)
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = value === 'dark' || (value === 'system' && prefersDark);
      root.classList.toggle('dark', isDark);
    }
  }, [value]);

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <CogIcon className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Theme</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how AI‑Newz looks on your device.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['light','dark','system'] as const).map(option => (
              <button
                key={option}
                onClick={() => setValue(option)}
                className={`border rounded-lg p-4 text-left transition-colors ${
                  value === option
                    ? 'border-primary-300 bg-primary-50 dark:border-primary-700/60 dark:bg-zinc-900'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="font-medium capitalize text-gray-900 dark:text-gray-100">{option}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {option === 'light' && 'Bright theme for well‑lit environments.'}
                  {option === 'dark' && 'Dim theme that’s easier on the eyes at night.'}
                  {option === 'system' && 'Follow your device’s appearance.'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Settings Component
function ProfileSettings({ userProfile, onSave, isSaving }: { 
  userProfile: UserProfile | null, 
  onSave: (data: any) => void, 
  isSaving: boolean 
}) {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    profile_picture: userProfile?.profile_picture || ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        email: userProfile.email,
        profile_picture: userProfile.profile_picture
      });
    }
  }, [userProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <UserIcon className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Picture URL
          </label>
          <input
            type="url"
            value={formData.profile_picture}
            onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://example.com/profile.jpg"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Email Settings Component
function EmailSettings({ emailPrefs, onSave, onTestEmail, isSaving }: { 
  emailPrefs: EmailPreferences, 
  onSave: (data: any) => void, 
  onTestEmail: () => void,
  isSaving: boolean 
}) {
  const [formData, setFormData] = useState(emailPrefs);

  useEffect(() => {
    setFormData(emailPrefs);
  }, [emailPrefs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <EnvelopeIcon className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Email Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Preferences</h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.daily_digest}
                onChange={(e) => setFormData({ ...formData, daily_digest: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Daily digest emails</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.newsletter_notifications}
                onChange={(e) => setFormData({ ...formData, newsletter_notifications: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Newsletter notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.marketing_emails}
                onChange={(e) => setFormData({ ...formData, marketing_emails: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Marketing emails</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Time
            </label>
            <input
              type="time"
              value={formData.delivery_time}
              onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Email Testing</h3>
          <button
            type="button"
            onClick={onTestEmail}
            disabled={isSaving}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <EnvelopeIcon className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Sending...' : 'Send Test Email'}</span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Newsletter Settings Component
function NewsletterSettings({ newsletterPrefs, onSave, isSaving }: { 
  newsletterPrefs: NewsletterPreferences, 
  onSave: (data: any) => void, 
  isSaving: boolean 
}) {
  const [formData, setFormData] = useState(newsletterPrefs);

  useEffect(() => {
    setFormData(newsletterPrefs);
  }, [newsletterPrefs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <DocumentTextIcon className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Newsletter Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Style
            </label>
            <select
              value={formData.default_style}
              onChange={(e) => setFormData({ ...formData, default_style: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Length
            </label>
            <select
              value={formData.default_length}
              onChange={(e) => setFormData({ ...formData, default_length: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Model
          </label>
          <select
            value={formData.ai_model}
            onChange={(e) => setFormData({ ...formData, ai_model: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude 3</option>
          </select>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Content Preferences</h3>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.include_trends}
              onChange={(e) => setFormData({ ...formData, include_trends: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Include trending topics</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.include_summaries}
              onChange={(e) => setFormData({ ...formData, include_summaries: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Include article summaries</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.auto_save_drafts}
              onChange={(e) => setFormData({ ...formData, auto_save_drafts: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Auto-save drafts</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings({ notificationSettings, onSave, isSaving }: { 
  notificationSettings: NotificationSettings, 
  onSave: (data: any) => void, 
  isSaving: boolean 
}) {
  const [formData, setFormData] = useState(notificationSettings);

  useEffect(() => {
    setFormData(notificationSettings);
  }, [notificationSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <BellIcon className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notification Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notification Types</h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.email_notifications}
                onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.push_notifications}
                onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Push notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.newsletter_alerts}
                onChange={(e) => setFormData({ ...formData, newsletter_alerts: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Newsletter alerts</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.system_updates}
                onChange={(e) => setFormData({ ...formData, system_updates: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">System updates</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Security Settings Component
function SecuritySettings({ userProfile, onSave, isSaving }: { 
  userProfile: UserProfile | null, 
  onSave: (data: any) => void, 
  isSaving: boolean 
}) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      alert('Passwords do not match');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Security Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Change Password</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={formData.current_password}
              onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.two_factor_enabled}
              onChange={(e) => setFormData({ ...formData, two_factor_enabled: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Enable two-factor authentication</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Integrations Settings Component
function IntegrationsSettings({ onSave, isSaving }: { 
  onSave: (data: any) => void, 
  isSaving: boolean 
}) {
  const [formData, setFormData] = useState({
    rss_feeds: true,
    social_media: false,
    analytics: true,
    email_providers: 'resend'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <GlobeAltIcon className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Integrations</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Data Sources</h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.rss_feeds}
                onChange={(e) => setFormData({ ...formData, rss_feeds: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">RSS Feeds</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.social_media}
                onChange={(e) => setFormData({ ...formData, social_media: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Social Media</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.analytics}
                onChange={(e) => setFormData({ ...formData, analytics: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Analytics</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Provider
          </label>
          <select
            value={formData.email_providers}
            onChange={(e) => setFormData({ ...formData, email_providers: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="resend">Resend</option>
            <option value="sendgrid">SendGrid</option>
            <option value="mailgun">Mailgun</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
