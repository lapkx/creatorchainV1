import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          user_type: "creator" | "viewer" | "admin"
          bio: string | null
          social_links: any
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: "creator" | "viewer" | "admin"
          bio?: string | null
          social_links?: any
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: "creator" | "viewer" | "admin"
          bio?: string | null
          social_links?: any
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          platform: "youtube" | "instagram" | "tiktok"
          content_url: string
          points_per_share: number
          campaign_duration: number
          status: "active" | "paused" | "completed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          platform: "youtube" | "instagram" | "tiktok"
          content_url: string
          points_per_share: number
          campaign_duration: number
          status?: "active" | "paused" | "completed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          platform?: "youtube" | "instagram" | "tiktok"
          content_url?: string
          points_per_share?: number
          campaign_duration?: number
          status?: "active" | "paused" | "completed"
          created_at?: string
          updated_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          content_id: string
          type: "physical" | "digital" | "raffle"
          title: string
          description: string | null
          shares_required: number
          quantity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          type: "physical" | "digital" | "raffle"
          title: string
          description?: string | null
          shares_required: number
          quantity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          type?: "physical" | "digital" | "raffle"
          title?: string
          description?: string | null
          shares_required?: number
          quantity?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          content_id: string
          viewer_id: string
          referral_link: string
          share_count: number
          points_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          viewer_id: string
          referral_link: string
          share_count?: number
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          viewer_id?: string
          referral_link?: string
          share_count?: number
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
      }
      viewer_rewards: {
        Row: {
          id: string
          viewer_id: string
          reward_id: string
          status: "pending" | "claimed" | "shipped"
          earned_date: string
          claimed_date: string | null
        }
        Insert: {
          id?: string
          viewer_id: string
          reward_id: string
          status?: "pending" | "claimed" | "shipped"
          earned_date?: string
          claimed_date?: string | null
        }
        Update: {
          id?: string
          viewer_id?: string
          reward_id?: string
          status?: "pending" | "claimed" | "shipped"
          earned_date?: string
          claimed_date?: string | null
        }
      }
    }
  }
}
