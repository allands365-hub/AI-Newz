/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fgpqvseaviqfjynryxwt.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHF2c2VhdmlxZmp5bnJ5eHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTc3OTgsImV4cCI6MjA3NTQzMzc5OH0.-KvYbIxr_S1YfTQeaCm2piUsw9Igm6etUhTMy5IXKNk',
  },
}

module.exports = nextConfig
