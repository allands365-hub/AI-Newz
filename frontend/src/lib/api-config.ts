// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    ME: `${API_BASE_URL}/api/v1/auth/me`,
    PREFERENCES: `${API_BASE_URL}/api/v1/auth/preferences`,
    PROFILE: `${API_BASE_URL}/api/v1/auth/profile`,
    LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
  },
  
  // Newsletter endpoints
  NEWSLETTERS: {
    GENERATE: `${API_BASE_URL}/api/v1/newsletters/generate`,
    TEST_GENERATE: `${API_BASE_URL}/api/v1/newsletters/test-generate`,
    TEST_GENERATE_CUSTOM: `${API_BASE_URL}/api/v1/test-newsletter-generate`,
    LIST: `${API_BASE_URL}/api/v1/newsletters/`,
    GET: (id: string) => `${API_BASE_URL}/api/v1/newsletters/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/v1/newsletters/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/v1/newsletters/${id}`,
    PUBLISH: (id: string) => `${API_BASE_URL}/api/v1/newsletters/${id}/publish`,
    ANALYTICS: `${API_BASE_URL}/api/v1/newsletters/analytics/summary`,
  },
  
  // Profile picture proxy
  PROFILE_PICTURE: (url: string) => `${API_BASE_URL}/api/v1/proxy-profile-picture?url=${encodeURIComponent(url)}`,
  
  // Email endpoints
  EMAIL: {
    SEND_NEWSLETTER: `${API_BASE_URL}/api/v1/email/send-newsletter`,
    SCHEDULE_NEWSLETTER: `${API_BASE_URL}/api/v1/email/schedule-newsletter`,
    SCHEDULE_DAILY: `${API_BASE_URL}/api/v1/email/schedule-daily-digest`,
    DELIVERY_STATUS: (id: string) => `${API_BASE_URL}/api/v1/email/delivery-status/${id}`,
    TEST_EMAIL: `${API_BASE_URL}/api/v1/email/test-email`,
  },
  
  // RSS endpoints
  RSS: {
    SOURCES: `${API_BASE_URL}/api/v1/rss/sources`,
    SOURCE: (id: number) => `${API_BASE_URL}/api/v1/rss/sources/${id}`,
    FETCH: `${API_BASE_URL}/api/v1/rss/fetch`,
    ARTICLES: `${API_BASE_URL}/api/v1/rss/articles`,
    ARTICLE: (id: number) => `${API_BASE_URL}/api/v1/rss/articles/${id}`,
    SEARCH: `${API_BASE_URL}/api/v1/rss/articles/search`,
    STATS: `${API_BASE_URL}/api/v1/rss/stats`,
    TEST_SOURCE: (id: number) => `${API_BASE_URL}/api/v1/rss/sources/${id}/test`,
    // Enhanced endpoints
    ENHANCED_ARTICLES: `${API_BASE_URL}/api/v1/rss/articles/enhanced`,
    ENHANCED_SOURCES: `${API_BASE_URL}/api/v1/rss/sources-enhanced`,
  },
  
  // Analytics endpoints
  ANALYTICS: {
    OVERVIEW: `${API_BASE_URL}/api/v1/analytics/overview`,
    RECENT_PERFORMANCE: `${API_BASE_URL}/api/v1/analytics/recent-performance`,
    TOP_CONTENT: `${API_BASE_URL}/api/v1/analytics/top-content`,
    GROWTH_TRENDS: `${API_BASE_URL}/api/v1/analytics/growth-trends`,
  },
};

export const getAuthHeaders = async () => {
  // Use the shared Supabase client to avoid multiple instances
  const { supabase } = await import('./supabase');
  
  // Get current session
  let { data: { session } } = await supabase.auth.getSession();
  
  // If no session or token is expired, try to refresh
  if (!session || !session.access_token) {
    console.log('No session found, attempting to refresh...');
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    session = refreshedSession;
  }
  
  const token = session?.access_token;
  
  // Debug logging
  console.log('Session data:', session);
  console.log('Token:', token ? `${token.substring(0, 20)}...` : 'No token');
  console.log('Token expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'Unknown');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};
