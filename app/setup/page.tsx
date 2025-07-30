"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, RefreshCw, Copy, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"

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

export default function SetupPage() {
  const [tables, setTables] = useState<TableStatus[]>([
    { name: "profiles", exists: false, description: "User profiles and account information" },
    { name: "content", exists: false, description: "Creator content and campaigns" },
    { name: "share_links", exists: false, description: "Trackable share links" },
    { name: "share_clicks", exists: false, description: "Click tracking and analytics" },
    { name: "user_points", exists: false, description: "Point system and rewards" },
    { name: "notifications", exists: false, description: "User notifications" },
  ])

  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { name: "NEXT_PUBLIC_SUPABASE_URL", exists: false, description: "Supabase project URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", exists: false, description: "Supabase anonymous key" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", exists: false, description: "Supabase service role key" },
    { name: "YOUTUBE_API_KEY", exists: false, description: "YouTube Data API key (optional)" },
  ])

  const [isChecking, setIsChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkEnvironmentVariables = () => {
    setEnvVars((prev) =>
      prev.map((envVar) => ({
        ...envVar,
        exists: !!process.env[envVar.name],
      })),
    )
  }

  const checkTables = async () => {
    setIsChecking(true)
    try {
      const updatedTables = await Promise.all(
        tables.map(async (table) => {
          try {
            const { error } = await supabase.from(table.name).select("*").limit(1)

            return {
              ...table,
              exists: !error,
            }
          } catch {
            return {
              ...table,
              exists: false,
            }
          }
        }),
      )
      setTables(updatedTables)
    } catch (error) {
      console.error("Error checking tables:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const copySQL = async () => {
    const sql = `-- CreatorChain Database Setup
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'viewer')) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content table
CREATE TABLE IF NOT EXISTS public.content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('youtube', 'instagram', 'tiktok')) NOT NULL,
  points_per_share INTEGER DEFAULT 10,
  max_shares INTEGER,
  current_shares INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_links table
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_id, viewer_id)
);

-- Create share_clicks table
CREATE TABLE IF NOT EXISTS public.share_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  share_link_id UUID REFERENCES public.share_links(id) ON DELETE CASCADE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Creators can manage own content" ON public.content FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Anyone can view active content" ON public.content FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own share links" ON public.share_links FOR ALL USING (auth.uid() = viewer_id);
CREATE POLICY "Creators can view their content share links" ON public.share_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.content WHERE content.id = share_links.content_id AND content.creator_id = auth.uid())
);

CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points" ON public.user_points FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
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
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data (optional)
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'creator@example.com', 'Sample Creator', 'creator'),
  ('00000000-0000-0000-0000-000000000002', 'viewer@example.com', 'Sample Viewer', 'viewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content (id, creator_id, title, description, content_url, platform, points_per_share) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sample YouTube Video', 'Check out this amazing content!', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 10)
ON CONFLICT (id) DO NOTHING;

-- Setup complete!
SELECT 'Database setup completed successfully!' as message;`

    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy SQL:", error)
    }
  }

  useEffect(() => {
    checkEnvironmentVariables()
    checkTables()
  }, [])

  const allTablesExist = tables.every((table) => table.exists)
  const allEnvVarsExist = envVars.filter((env) => env.name !== "YOUTUBE_API_KEY").every((env) => env.exists)
  const setupComplete = allTablesExist && allEnvVarsExist

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CreatorChain Setup</h1>
        <p className="text-muted-foreground">
          Initialize your database and configure environment variables to get started.
        </p>
      </div>

      {setupComplete && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Setup Complete!</span>
            </div>
            <p className="text-green-600 mt-1">
              Your CreatorChain platform is ready to use. You can now create accounts and start using the platform.
            </p>
            <div className="flex gap-2 mt-4">
              <Button asChild size="sm">
                <a href="/signup">Create Account</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/login">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Environment Variables
              <Badge variant={allEnvVarsExist ? "default" : "destructive"}>
                {envVars.filter((env) => env.exists).length}/{envVars.length}
              </Badge>
            </CardTitle>
            <CardDescription>Required environment variables for the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {envVars.map((envVar) => (
                <div key={envVar.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-sm">{envVar.name}</div>
                    <div className="text-xs text-muted-foreground">{envVar.description}</div>
                  </div>
                  {envVar.exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="text-sm text-muted-foreground">
              Configure these in your Vercel dashboard under Settings → Environment Variables
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Database Tables
              <Badge variant={allTablesExist ? "default" : "destructive"}>
                {tables.filter((table) => table.exists).length}/{tables.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={checkTables} disabled={isChecking}>
                <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
              </Button>
            </CardTitle>
            <CardDescription>Required database tables and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-sm">{table.name}</div>
                    <div className="text-xs text-muted-foreground">{table.description}</div>
                  </div>
                  {table.exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>
            Run this SQL script in your Supabase SQL Editor to create all required tables and functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={copySQL} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy SQL Script"}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </a>
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg text-sm">
            <div className="font-medium mb-2">Setup Instructions:</div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Copy the SQL script above</li>
              <li>Go to your Supabase dashboard → SQL Editor</li>
              <li>Paste and run the script</li>
              <li>Click the refresh button to verify tables were created</li>
              <li>Configure your environment variables in Vercel</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
