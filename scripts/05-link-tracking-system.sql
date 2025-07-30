-- Create referral_links table for tracking unique links
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  link_code TEXT UNIQUE NOT NULL,
  full_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_id, viewer_id)
);

-- Create link_clicks table for detailed tracking
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_link_id UUID REFERENCES referral_links(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_shares table for tracking actual shares
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_link_id UUID REFERENCES referral_links(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'twitter', 'facebook')),
  share_url TEXT,
  share_id TEXT, -- Platform-specific share ID
  engagement_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reward_earned', 'milestone_reached', 'share_verified', 'campaign_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fraud_detection table for anti-bot protection
CREATE TABLE IF NOT EXISTS fraud_detection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0,
  flags JSONB,
  ip_address INET,
  user_agent TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_links_content_viewer ON referral_links(content_id, viewer_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(link_code);
CREATE INDEX IF NOT EXISTS idx_link_clicks_referral_link ON link_clicks(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_social_shares_referral_link ON social_shares(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_user_id ON fraud_detection(user_id);

-- Add RLS policies
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection ENABLE ROW LEVEL SECURITY;

-- Referral links policies
CREATE POLICY "Users can view their own referral links" ON referral_links
  FOR SELECT USING (auth.uid() = viewer_id);

CREATE POLICY "Users can create their own referral links" ON referral_links
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Creators can view referral links for their content" ON referral_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content 
      WHERE content.id = referral_links.content_id 
      AND content.creator_id = auth.uid()
    )
  );

-- Link clicks policies (public for tracking)
CREATE POLICY "Anyone can insert link clicks" ON link_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view clicks for their referral links" ON link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM referral_links 
      WHERE referral_links.id = link_clicks.referral_link_id 
      AND referral_links.viewer_id = auth.uid()
    )
  );

-- Social shares policies
CREATE POLICY "Users can manage their own social shares" ON social_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM referral_links 
      WHERE referral_links.id = social_shares.referral_link_id 
      AND referral_links.viewer_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Fraud detection policies (admin only for now)
CREATE POLICY "System can insert fraud detection records" ON fraud_detection
  FOR INSERT WITH CHECK (true);
