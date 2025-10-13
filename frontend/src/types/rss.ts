// Enhanced RSS interfaces for visual snippets and branding
export interface EnhancedArticle {
  id: number;
  title: string;
  url: string;
  summary: string;
  author?: string;
  published_at: string;
  fetched_at: string;
  rss_source_id: number;
  rss_source_name: string;
  rss_source_logo?: string;
  rss_source_platform?: string;
  rss_source_brand_color?: string;
  rss_source_verification?: string;
  category?: string;
  tags: string[];
  sentiment_score?: number;
  readability_score?: number;
  word_count: number;
  reading_time?: number;
  image_url?: string;
  thumbnail_url?: string;
  image_alt_text?: string;
  has_images: boolean;
  has_videos: boolean;
  has_lists: boolean;
  has_quotes: boolean;
  content_type?: string;
  engagement_score: number;
  social_shares: number;
  quality_score: number;
}

export interface EnhancedRSSSource {
  id: number;
  name: string;
  url: string;
  description?: string;
  category?: string;
  language: string;
  is_active: boolean;
  credibility_score: number;
  last_fetched?: string;
  fetch_frequency: number;
  logo_url?: string;
  favicon_url?: string;
  brand_color?: string;
  platform?: string;
  verification_status: string;
  preferred_image_size: string;
  content_focus: string[];
  created_at: string;
  updated_at?: string;
}

export interface ArticlesResponse {
  articles: EnhancedArticle[];
  total: number;
  has_more: boolean;
  pagination: {
    skip: number;
    limit: number;
    total: number;
  };
}

export interface SourcesResponse {
  sources: EnhancedRSSSource[];
}

export interface ArticleCardProps {
  article: EnhancedArticle;
  onRead: (article: EnhancedArticle) => void;
  onShare: (article: EnhancedArticle) => void;
  onEmail: (article: EnhancedArticle) => void;
}

export interface ArticlesGridProps {
  articles: EnhancedArticle[];
  loading: boolean;
  onRead: (article: EnhancedArticle) => void;
  onShare: (article: EnhancedArticle) => void;
  onEmail: (article: EnhancedArticle) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  selectedSource?: number;
  onSourceFilter: (sourceId?: number) => void;
}

export interface EnhancedRSSSourceListProps {
  sources: EnhancedRSSSource[];
  loading: boolean;
  error: string | null;
  onEdit: (source: EnhancedRSSSource) => void;
  onDelete: (id: number) => void;
  onTest: (id: number) => void;
  onRefresh: () => void;
}
