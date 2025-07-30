"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Database, RefreshCw, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

// Database status checker function
async function checkDatabaseStatus(): Promise<Record<string, boolean>> {
  const requiredTables = ["profiles", "content", "share_links", "share_tracking", "notifications", "user_stats"]
  const status: Record<string, boolean> = {}

  for (const table of requiredTables) {
    try {
      const response = await fetch(`/api/check-table?table=${table}`)
      const result = await response.json()
      status[table] = result.exists
    } catch (error) {
      status[table] = false
    }
  }

  return status
}

function isDatabaseReady(status: Record<string, boolean>): boolean {
  return Object.values(status).every(Boolean)
}

export default function SetupPage() {
  const [status, setStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  const checkStatus = async () => {
    setChecking(true)
    try {
      const dbStatus = await checkDatabaseStatus()
      setStatus(dbStatus)
    } catch (error) {
      console.error("Error checking database status:", error)
      toast.error("Failed to check database status")
    } finally {
      setChecking(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const isReady = isDatabaseReady(status)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const sqlScripts = [
    {
      name: "01-create-tables.sql",
      description: "Creates all required database tables",
      sql: `-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'viewer')) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_links table
CREATE TABLE IF NOT EXISTS share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_tracking table
CREATE TABLE IF NOT EXISTS share_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id UUID REFERENCES share_links(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  share_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_shares INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    },
    {
      name: "02-setup-rls.sql",
      description: "Sets up Row Level Security policies",
      sql: `-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Content policies
CREATE POLICY "Creators can manage own content" ON content FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Anyone can view published content" ON content FOR SELECT USING (status = 'published');

-- Share links policies
CREATE POLICY "Anyone can view share links" ON share_links FOR SELECT USING (true);
CREATE POLICY "Creators can manage share links for own content" ON share_links FOR ALL USING (
  EXISTS (SELECT 1 FROM content WHERE content.id = share_links.content_id AND content.creator_id = auth.uid())
);

-- Share tracking policies
CREATE POLICY "Users can view own share tracking" ON share_tracking FOR SELECT USING (auth.uid() = viewer_id);
CREATE POLICY "Users can insert own share tracking" ON share_tracking FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);`,
    },
    {
      name: "03-create-functions.sql",
      description: "Creates database functions and triggers",
      sql: `-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'viewer')
  );
  
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.verified = TRUE THEN
    UPDATE user_stats 
    SET 
      total_shares = total_shares + 1,
      total_points = total_points + NEW.points_awarded,
      updated_at = NOW()
    WHERE user_id = NEW.viewer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for share tracking updates
DROP TRIGGER IF EXISTS on_share_verified ON share_tracking;
CREATE TRIGGER on_share_verified
  AFTER INSERT OR UPDATE ON share_tracking
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();`,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <Database className="h-16 w-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Setup</h1>
          <p className="text-gray-600">Initialize your Creatorchain database</p>
        </div>

        <div className="grid gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Database Status
                    {loading ? (
                      <Badge variant="secondary">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Checking...
                      </Badge>
                    ) : isReady ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Setup Required
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Check if all required database tables are created</CardDescription>
                </div>
                <Button onClick={checkStatus} disabled={checking} variant="outline" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Checking database status...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(status).map(([table, exists]) => (
                    <div key={table} className="flex items-center gap-2 p-3 border rounded-lg">
                      {exists ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{table}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Variables Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Environment Variables
              </CardTitle>
              <CardDescription>Required environment variables for the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm">NEXT_PUBLIC_SUPABASE_URL</code>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm">YOUTUBE_API_KEY</code>
                  <Badge variant={process.env.YOUTUBE_API_KEY ? "default" : "secondary"}>
                    {process.env.YOUTUBE_API_KEY ? "Set" : "Optional"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Manual Database Setup
              </CardTitle>
              <CardDescription>Run these SQL scripts in your Supabase SQL Editor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="font-semibold">Supabase Dashboard</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Go to your Supabase project dashboard → SQL Editor → New query
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                    Open Supabase Dashboard
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>

              {sqlScripts.map((script, index) => (
                <div key={script.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        Step {index + 1}: {script.name}
                      </h3>
                      <p className="text-sm text-gray-600">{script.description}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(script.sql)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy SQL
                    </Button>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <pre>{script.sql}</pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Success State */}
          {isReady && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Database Ready!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your database is properly configured. You can now use the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button asChild>
                    <a href="/">Go to Home</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/signup">Create Account</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/test/youtube">Test YouTube Integration</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
