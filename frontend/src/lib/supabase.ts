import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (we'll generate these later)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          profile_picture: string | null
          google_id: string | null
          password_hash: string | null
          subscription_tier: 'free' | 'premium' | 'enterprise'
          auth_provider: 'google' | 'email'
          is_active: boolean
          is_verified: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          profile_picture?: string | null
          google_id?: string | null
          password_hash?: string | null
          subscription_tier?: 'free' | 'premium' | 'enterprise'
          auth_provider?: 'google' | 'email'
          is_active?: boolean
          is_verified?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          profile_picture?: string | null
          google_id?: string | null
          password_hash?: string | null
          subscription_tier?: 'free' | 'premium' | 'enterprise'
          auth_provider?: 'google' | 'email'
          is_active?: boolean
          is_verified?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_sources: string[]
          content_categories: string[]
          newsletter_frequency: 'daily' | 'weekly' | 'monthly'
          ai_style: 'professional' | 'casual' | 'technical'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_sources?: string[]
          content_categories?: string[]
          newsletter_frequency?: 'daily' | 'weekly' | 'monthly'
          ai_style?: 'professional' | 'casual' | 'technical'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_sources?: string[]
          content_categories?: string[]
          newsletter_frequency?: 'daily' | 'weekly' | 'monthly'
          ai_style?: 'professional' | 'casual' | 'technical'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'premium' | 'enterprise'
      auth_provider: 'google' | 'email'
      newsletter_frequency: 'daily' | 'weekly' | 'monthly'
      ai_style: 'professional' | 'casual' | 'technical'
    }
  }
}
