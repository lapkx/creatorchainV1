"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, RefreshCw, Copy, ExternalLink, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface TableStatus {
  name: string
  exists: boolean
  description: string
}

export default function SetupPage() {
  const [tables, setTables] = useState<TableStatus[]>([
    { name: "profiles", exists: false, description: "User profile information" },
    { name: "content", exists: false, description: "Creator content and campaigns" },
    { name: "share_links", exists: false, description: "Trackable share links" },
    { name: "share_clicks", exists: false, description: "Click tracking data" },
    { name: "user_points", exists: false, description: "User point balances" },
    { name: "point_transactions", exists: false, description: "Point transaction history" },
  ])

  const [isChecking, setIsChecking] = useState(false)
  const [envStatus, setEnvStatus] = useState({
    supabaseUrl: false,
    supabaseAnonKey: false,
    supabaseServiceKey: false,
  })

  const checkEnvironmentVariables = () => {
    setEnvStatus({
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
  }

  const checkTables = async () => {
    setIsChecking(true)
    try {
      const supabase = createClient()

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const allTablesExist = tables.every((table) => table.exists)
  const allEnvVarsSet = Object.values(envStatus).every(Boolean)

  useEffect(() => {
    checkEnvironmentVariables()
    checkTables()
  }, [])

  const setupSQL = `-- Creatorchain Database Setup
-- Run these commands in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'viewer')) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create content table
CREATE TABLE IF NOT EXISTS public.content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  points_per_share INTEGER DEFAULT 10,
  max_shares INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create share_links table
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.content(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create share_clicks table
CREATE TABLE IF NOT EXISTS public.share_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id UUID REFERENCES public.share_links(id) NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  verified BOOLEAN DEFAULT false,
  points_awarded INTEGER DEFAULT 0
);

-- 5. Create user_points table
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create point_transactions table
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  content_id UUID REFERENCES public.content(id),
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'spent', 'bonus')) NOT NULL,
  points INTEGER NOT NULL,
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
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Creators can manage own content" ON public.content
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view active content" ON public.content
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own share links" ON public.share_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_points (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_creator_id ON public.content(creator_id);
CREATE INDEX IF NOT EXISTS idx_share_links_content_id ON public.share_links(content_id);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON public.share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_clicks_share_link_id ON public.share_clicks(share_link_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);`

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Creatorchain Database Setup</h1>
        <p className="text-muted-foreground">
          Initialize your database tables and configure your environment for the Creatorchain platform.
        </p>
      </div>

      {/* Environment Variables Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>Required environment variables for the application to function</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
            {envStatus.supabaseUrl ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Set
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Missing
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            {envStatus.supabaseAnonKey ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Set
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Missing
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</span>
            {envStatus.supabaseServiceKey ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Set
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Missing
              </Badge>
            )}
          </div>

          {!allEnvVarsSet && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Missing environment variables. Add them to your Vercel project settings or .env.local file.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Database Tables Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Database Tables</span>
            <Button variant="outline" size="sm" onClick={checkTables} disabled={isChecking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>Status of required database tables in your Supabase project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-mono text-sm font-medium">{table.name}</div>
                  <div className="text-xs text-muted-foreground">{table.description}</div>
                </div>
                {table.exists ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Exists
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Missing
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {allTablesExist ? (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All database tables are set up correctly! Your Creatorchain platform is ready to use.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Some tables are missing. Use the SQL script below to create them.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!allTablesExist && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Database Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to initialize your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Open Supabase SQL Editor</h4>
              <p className="text-sm text-muted-foreground">
                Go to your Supabase project dashboard and open the SQL Editor
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Supabase Dashboard
                </a>
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Run the Setup SQL</h4>
              <p className="text-sm text-muted-foreground">
                Copy and paste the following SQL script into the SQL Editor and run it
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                  <code>{setupSQL}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-transparent"
                  onClick={() => copyToClipboard(setupSQL)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Step 3: Verify Setup</h4>
              <p className="text-sm text-muted-foreground">
                After running the SQL script, click the refresh button above to verify all tables were created
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to different parts of the application</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <a href="/">Home Page</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/signup">Sign Up</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/login">Login</a>
          </Button>
          {allTablesExist && (
            <Button asChild>
              <a href="/creator/dashboard">Creator Dashboard</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
