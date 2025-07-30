-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('creator', 'viewer')),
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  content_url TEXT NOT NULL,
  points_per_share INTEGER NOT NULL DEFAULT 10,
  campaign_duration INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('physical', 'digital', 'raffle')),
  title TEXT NOT NULL,
  description TEXT,
  shares_required INTEGER NOT NULL,
  quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shares table
CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_link TEXT NOT NULL,
  share_count INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_id, viewer_id)
);

-- Create viewer_rewards table
CREATE TABLE IF NOT EXISTS viewer_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'shipped')),
  earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_content_creator_id ON content(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_rewards_content_id ON rewards(content_id);
CREATE INDEX IF NOT EXISTS idx_shares_content_id ON shares(content_id);
CREATE INDEX IF NOT EXISTS idx_shares_viewer_id ON shares(viewer_id);
CREATE INDEX IF NOT EXISTS idx_viewer_rewards_viewer_id ON viewer_rewards(viewer_id);
CREATE INDEX IF NOT EXISTS idx_viewer_rewards_status ON viewer_rewards(status);
