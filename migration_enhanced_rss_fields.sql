-- Migration to add enhanced fields to RSS tables
-- Run this in your Supabase SQL editor

-- Add enhanced fields to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS image_alt_text VARCHAR(500),
ADD COLUMN IF NOT EXISTS reading_time INTEGER,
ADD COLUMN IF NOT EXISTS has_images BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_videos BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_lists BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_quotes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS engagement_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS social_shares INTEGER DEFAULT 0;

-- Add enhanced fields to rss_sources table
ALTER TABLE rss_sources 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS platform VARCHAR(50),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS preferred_image_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS content_focus JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_image_url ON articles(image_url);
CREATE INDEX IF NOT EXISTS idx_articles_content_type ON articles(content_type);
CREATE INDEX IF NOT EXISTS idx_articles_has_images ON articles(has_images);
CREATE INDEX IF NOT EXISTS idx_rss_sources_platform ON rss_sources(platform);
CREATE INDEX IF NOT EXISTS idx_rss_sources_verification ON rss_sources(verification_status);

-- Update existing records with default values
UPDATE articles SET 
    has_images = FALSE,
    has_videos = FALSE,
    has_lists = FALSE,
    has_quotes = FALSE,
    engagement_score = 0.0,
    social_shares = 0
WHERE has_images IS NULL;

UPDATE rss_sources SET 
    verification_status = 'unverified',
    preferred_image_size = 'medium'
WHERE verification_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN articles.image_url IS 'Main article image URL';
COMMENT ON COLUMN articles.thumbnail_url IS 'Small thumbnail image URL';
COMMENT ON COLUMN articles.image_alt_text IS 'Alt text for accessibility';
COMMENT ON COLUMN articles.reading_time IS 'Estimated reading time in minutes';
COMMENT ON COLUMN articles.has_images IS 'Whether article contains images';
COMMENT ON COLUMN articles.has_videos IS 'Whether article contains videos';
COMMENT ON COLUMN articles.has_lists IS 'Whether article contains lists';
COMMENT ON COLUMN articles.has_quotes IS 'Whether article contains quotes';
COMMENT ON COLUMN articles.content_type IS 'Type of content (article, video, podcast, etc.)';
COMMENT ON COLUMN articles.engagement_score IS 'Calculated engagement score';
COMMENT ON COLUMN articles.social_shares IS 'Number of social media shares';

COMMENT ON COLUMN rss_sources.logo_url IS 'Source logo URL';
COMMENT ON COLUMN rss_sources.favicon_url IS 'Source favicon URL';
COMMENT ON COLUMN rss_sources.brand_color IS 'Brand color hex code';
COMMENT ON COLUMN rss_sources.platform IS 'Platform identifier (reddit, hackernews, etc.)';
COMMENT ON COLUMN rss_sources.verification_status IS 'Verification status (verified, unverified, pending)';
COMMENT ON COLUMN rss_sources.preferred_image_size IS 'Preferred image size (small, medium, large)';
COMMENT ON COLUMN rss_sources.content_focus IS 'Content focus areas as JSON array';
