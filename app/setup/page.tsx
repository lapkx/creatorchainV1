"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, RefreshCw, Copy, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

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
  const [tables, setTables] = useState<TableStatus[]>([])
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const requiredTables = [
    { name: "profiles", description: "User profile information" },
    { name: "content", description: "Creator content and campaigns" },
    { name: "share_links", description: "Trackable share links" },
    { name: "share_clicks", description: "Click tracking data" },
    { name: "user_points", description: "User point balances" },
    { name: "point_transactions", description: "Point transaction history" },
  ]

  const requiredEnvVars = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anonymous key" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key" },
    { name: "YOUTUBE_API_KEY", description: "YouTube Data API key (optional)" },
  ]

  const checkEnvironmentVariables = () => {
    const envStatus = requiredEnvVars.map((envVar) => ({
      ...envVar,
      exists: !!process.env[envVar.name],
    }))
    setEnvVars(envStatus)
  }

  const checkTables = async () => {
    setLoading(true)
    try {
      const tableStatus = await Promise.all(
        requiredTables.map(async (table) => {
          try {
            const { error } = await supabase.from(table.name).select("*").limit(1)

            return {
              ...table,
              exists: !error,
            }
          } catch (err) {
            return {
              ...table,
              exists: false,
            }
          }
        }),
      )
      setTables(tableStatus)
    } catch (error) {
      console.error("Error checking tables:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkEnvironmentVariables()
    checkTables()
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const sqlScript = `-- CreatorChain Database Setup Script
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'viewer')) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content table
CREATE TABLE IF NOT EXISTS public.content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  points_per_share INTEGER DEFAULT 10,
  max_shares INTEGER,
  current_shares INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_links table
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  verified_shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create share_clicks table
CREATE TABLE IF NOT EXISTS public.share_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id UUID REFERENCES public.share_links(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verification_data JSONB
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  pending_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create point_transactions table
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE SET NULL,
  share_link_id UUID REFERENCES public.share_links(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty')) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Content policies
CREATE POLICY "Creators can manage own content" ON public.content
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view active content" ON public.content
  FOR SELECT USING (status = 'active');

-- Share links policies
CREATE POLICY "Users can manage own share links" ON public.share_links
  FOR ALL USING (auth.uid() = user_id);

-- Share clicks policies (admin only for now)
CREATE POLICY "Service role can manage clicks" ON public.share_clicks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User points policies
CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON public.user_points
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON public.user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Point transactions policies
CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_points (user_id, total_points, available_points, pending_points)
  VALUES (NEW.id, 0, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_creator_id ON public.content(creator_id);
CREATE INDEX IF NOT EXISTS idx_share_links_content_id ON public.share_links(content_id);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON public.share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_code ON public.share_links(share_code);
CREATE INDEX IF NOT EXISTS idx_share_clicks_link_id ON public.share_clicks(share_link_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);

-- Insert sample data (optional)
-- This will be handled by the application
`

  const allTablesExist = tables.length > 0 && tables.every((table) => table.exists)
  const allEnvVarsExist = envVars.every((envVar) => envVar.exists || envVar.name === "YOUTUBE_API_KEY")

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CreatorChain Setup</h1>
        <p className="text-muted-foreground">Initialize your database and configure your environment to get started.</p>
      </div>

      <div className="grid gap-6">
        {/* Environment Variables Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Environment Variables
              {allEnvVarsExist ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Missing
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Required environment variables for the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {envVars.map((envVar) => (
                <div key={envVar.name} className="flex items-center justify-between">
                  <div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{envVar.name}</code>
                    <p className="text-sm text-muted-foreground mt-1">{envVar.description}</p>
                  </div>
                  {envVar.exists ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Set
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Database Tables Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Database Tables
              {allTablesExist ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Missing
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={checkTables} disabled={loading}>
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardTitle>
            <CardDescription>Required database tables for the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between">
                  <div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{table.name}</code>
                    <p className="text-sm text-muted-foreground mt-1">{table.description}</p>
                  </div>
                  {table.exists ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Exists
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Database Setup</CardTitle>
            <CardDescription>
              Run the following SQL script in your Supabase SQL Editor to create all required tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(sqlScript)}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy SQL Script"}
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/default/sql`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Supabase SQL Editor
                  </a>
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{sqlScript}</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Status & Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardDescription>Current setup progress and next steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Environment Variables:</span>
                {allEnvVarsExist ? (
                  <Badge variant="default" className="bg-green-500">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="destructive">Incomplete</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Database Tables:</span>
                {allTablesExist ? (
                  <Badge variant="default" className="bg-green-500">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="destructive">Incomplete</Badge>
                )}
              </div>

              <Separator />

              {allTablesExist && allEnvVarsExist ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600 font-medium">
                    ✅ Setup complete! You can now use the application.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link href="/signup">Create Account</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/">Home</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-amber-600 font-medium">
                    ⚠️ Setup incomplete. Please complete the steps above.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <p>Next steps:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {!allEnvVarsExist && <li>Configure missing environment variables in Vercel</li>}
                      {!allTablesExist && <li>Run the SQL script in your Supabase SQL Editor</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
