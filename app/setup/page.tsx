"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Copy, Database, Key, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface TableStatus {
  name: string
  exists: boolean
  description: string
}

interface EnvVar {
  name: string
  exists: boolean
  description: string
}

interface SetupStatus {
  envVars: EnvVar[]
  tables: TableStatus[]
  error?: string
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/setup-status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error fetching setup status:", error)
      setStatus({
        envVars: [],
        tables: [],
        error: "Failed to fetch setup status",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const completeDatabaseSetupScript = `-- CreatorChain Database Complete Setup Script
-- This script fixes infinite recursion and sets up the database properly

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.share_clicks CASCADE;
DROP TABLE IF EXISTS public.share_links CASCADE;
DROP TABLE IF EXISTS public.content CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'viewer', 'admin')) NOT NULL DEFAULT 'viewer',
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content table
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'twitch', 'x')) NOT NULL,
  content_type TEXT CHECK (content_type IN ('video', 'short', 'live', 'post')) NOT NULL DEFAULT 'video',
  points_per_share INTEGER DEFAULT 10 CHECK (points_per_share BETWEEN 1 AND 100),
  max_shares INTEGER CHECK (max_shares BETWEEN 1 AND 10000),
  current_shares INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_links table
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  shortened_url TEXT,
  clicks INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT CHECK (verification_method IN ('auto', 'manual', 'system')),
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_id, viewer_id)
);

-- Create share_clicks table
CREATE TABLE public.share_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'other')),
  browser TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_points table
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points >= 0),
  reason TEXT NOT NULL,
  point_type TEXT CHECK (point_type IN ('share', 'view', 'referral', 'bonus', 'penalty')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'achievement', 'reward', 'system')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX idx_content_creator ON public.content(creator_id);
CREATE INDEX idx_content_platform ON public.content(platform);
CREATE INDEX idx_share_links_content ON public.share_links(content_id);
CREATE INDEX idx_share_links_viewer ON public.share_links(viewer_id);
CREATE INDEX idx_share_links_code ON public.share_links(share_code);
CREATE INDEX idx_user_points_user ON public.user_points(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE RLS policies (no recursion)
-- Profiles policies
CREATE POLICY "profiles_own_access" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Content policies
CREATE POLICY "content_creator_access" ON public.content
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "content_public_read" ON public.content
  FOR SELECT USING (is_active = true);

-- Share links policies
CREATE POLICY "share_links_viewer_access" ON public.share_links
  FOR ALL USING (auth.uid() = viewer_id);

-- Share clicks policies (allow inserts for tracking)
CREATE POLICY "share_clicks_insert" ON public.share_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "share_clicks_view_own" ON public.share_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.share_links 
      WHERE share_links.id = share_clicks.share_link_id 
      AND share_links.viewer_id = auth.uid()
    )
  );

-- User points policies
CREATE POLICY "user_points_own_access" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_points_system_insert" ON public.user_points
  FOR INSERT WITH CHECK (true);

-- Notifications policies
CREATE POLICY "notifications_own_access" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'viewer')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth
    RAISE WARNING 'Error creating profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

SELECT 'CreatorChain Database Setup Complete!' as message;`

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load setup status. Please refresh the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const allTablesExist = status.tables.every((table) => table.exists)
  const allRequiredEnvVars = status.envVars.filter((env) => env.name !== "YOUTUBE_API_KEY").every((env) => env.exists)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">CreatorChain Setup</h1>
        <p className="text-muted-foreground">Configure your database and environment</p>
      </div>

      {/* Database Setup Alert */}
      {!allTablesExist && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">🚨 Database Setup Required</AlertTitle>
          <AlertDescription className="text-orange-700">
            Your database tables are not set up yet. This will cause infinite recursion errors when trying to log in.
            Run the complete setup script below to fix this issue.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {allTablesExist && allRequiredEnvVars && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">✅ Setup Complete!</AlertTitle>
          <AlertDescription className="text-green-700">
            All required tables and environment variables are configured correctly.
          </AlertDescription>
        </Alert>
      )}

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>Required configuration for Supabase and external services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status.envVars.map((env) => (
            <div key={env.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{env.name}</div>
                <div className="text-sm text-muted-foreground">{env.description}</div>
              </div>
              <Badge variant={env.exists ? "default" : "destructive"} className="flex items-center gap-1">
                {env.exists ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {env.exists ? "Set" : "Missing"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Database Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables
          </CardTitle>
          <CardDescription>Required database tables for the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status.tables.map((table) => (
            <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{table.name}</div>
                <div className="text-sm text-muted-foreground">{table.description}</div>
              </div>
              <Badge variant={table.exists ? "default" : "destructive"} className="flex items-center gap-1">
                {table.exists ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {table.exists ? "Exists" : "Missing"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Database Setup Script */}
      {!allTablesExist && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">🔧 Database Setup Script</CardTitle>
            <CardDescription>
              Copy and run this script in your Supabase SQL Editor to set up all required tables and fix RLS policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => copyToClipboard(completeDatabaseSetupScript)}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy COMPLETE FIX Script
            </Button>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Copy the script above</li>
                <li>Go to your Supabase Dashboard → SQL Editor</li>
                <li>Paste and run the complete script</li>
                <li>Refresh this page to verify setup</li>
                <li>Try logging in - the infinite recursion error will be fixed</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  )
}
