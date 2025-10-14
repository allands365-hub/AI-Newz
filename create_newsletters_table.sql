-- Create newsletters table in Supabase
CREATE TABLE IF NOT EXISTS newsletters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    ai_model TEXT,
    ai_parameters JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    read_time_minutes TEXT,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_newsletters_user_id ON newsletters(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to ensure users can only access their own newsletters
CREATE POLICY "Users can only access their own newsletters" ON newsletters
    FOR ALL USING (auth.uid()::text = user_id);

-- Grant necessary permissions
GRANT ALL ON newsletters TO authenticated;
GRANT ALL ON newsletters TO service_role;
