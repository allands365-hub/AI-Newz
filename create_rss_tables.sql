-- Create RSS sources table
CREATE TABLE IF NOT EXISTS rss_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    credibility_score FLOAT DEFAULT 0.0,
    last_fetched TIMESTAMP WITH TIME ZONE,
    fetch_frequency INTEGER DEFAULT 3600,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for RSS sources
CREATE INDEX IF NOT EXISTS idx_rss_sources_name ON rss_sources(name);
CREATE INDEX IF NOT EXISTS idx_rss_sources_url ON rss_sources(url);
CREATE INDEX IF NOT EXISTS idx_rss_sources_category ON rss_sources(category);
CREATE INDEX IF NOT EXISTS idx_rss_sources_is_active ON rss_sources(is_active);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL UNIQUE,
    content TEXT,
    summary TEXT,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Source relationship
    rss_source_id INTEGER NOT NULL REFERENCES rss_sources(id) ON DELETE CASCADE,
    
    -- Content analysis
    category VARCHAR(100),
    tags JSONB,
    sentiment_score FLOAT,
    readability_score FLOAT,
    word_count INTEGER DEFAULT 0,
    
    -- Newsletter integration
    is_used_in_newsletter BOOLEAN DEFAULT FALSE,
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE SET NULL,
    
    -- Quality metrics
    quality_score FLOAT DEFAULT 0.0,
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_rss_source_id ON articles(rss_source_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_used_in_newsletter ON articles(is_used_in_newsletter);
CREATE INDEX IF NOT EXISTS idx_articles_newsletter_id ON articles(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_articles_quality_score ON articles(quality_score);
CREATE INDEX IF NOT EXISTS idx_articles_is_duplicate ON articles(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_articles_is_active ON articles(is_active);

-- Create GIN index for JSONB tags column
CREATE INDEX IF NOT EXISTS idx_articles_tags_gin ON articles USING GIN(tags);

-- Add some sample RSS sources
INSERT INTO rss_sources (name, url, description, category, language, credibility_score, fetch_frequency) VALUES
('TechCrunch', 'https://techcrunch.com/feed/', 'Technology news and startup information', 'technology', 'en', 0.9, 1800),
('Hacker News', 'https://hnrss.org/frontpage', 'Hacker News front page RSS feed', 'technology', 'en', 0.8, 1800),
('BBC Technology', 'http://feeds.bbci.co.uk/news/technology/rss.xml', 'BBC Technology news', 'technology', 'en', 0.95, 3600),
('Reuters Business', 'https://feeds.reuters.com/reuters/businessNews', 'Reuters business news', 'business', 'en', 0.9, 3600),
('Scientific American', 'https://rss.sciam.com/ScientificAmerican-News', 'Scientific American news', 'science', 'en', 0.9, 7200),
('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index/', 'Technology and science news', 'technology', 'en', 0.85, 1800),
('Wired', 'https://www.wired.com/feed/rss', 'Wired technology and culture news', 'technology', 'en', 0.8, 3600),
('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'MIT Technology Review', 'technology', 'en', 0.9, 3600)
ON CONFLICT (url) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_rss_sources_updated_at BEFORE UPDATE ON rss_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
