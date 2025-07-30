-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_rewards ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow auth admin to create profiles" ON public.profiles
  FOR INSERT TO supabase_auth_admin WITH CHECK (true);

CREATE POLICY "Anyone can view public profile info" ON profiles
  FOR SELECT USING (true);

-- Content policies
CREATE POLICY "Creators can manage their own content" ON content
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view active content" ON content
  FOR SELECT USING (status = 'active');

-- Rewards policies
CREATE POLICY "Creators can manage rewards for their content" ON rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content 
      WHERE content.id = rewards.content_id 
      AND content.creator_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view rewards for active content" ON rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content 
      WHERE content.id = rewards.content_id 
      AND content.status = 'active'
    )
  );

-- Shares policies
CREATE POLICY "Viewers can manage their own shares" ON shares
  FOR ALL USING (auth.uid() = viewer_id);

CREATE POLICY "Creators can view shares for their content" ON shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content 
      WHERE content.id = shares.content_id 
      AND content.creator_id = auth.uid()
    )
  );

-- Viewer rewards policies
CREATE POLICY "Viewers can view their own rewards" ON viewer_rewards
  FOR SELECT USING (auth.uid() = viewer_id);

CREATE POLICY "Viewers can update their own reward claims" ON viewer_rewards
  FOR UPDATE USING (auth.uid() = viewer_id);

CREATE POLICY "Creators can view rewards for their content" ON viewer_rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rewards r
      JOIN content c ON c.id = r.content_id
      WHERE r.id = viewer_rewards.reward_id 
      AND c.creator_id = auth.uid()
    )
  );
