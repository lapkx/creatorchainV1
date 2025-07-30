-- Create function to increment user stats atomically
CREATE OR REPLACE FUNCTION increment_user_stats(
  user_id UUID,
  points_to_add INTEGER DEFAULT 0,
  shares_to_add INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
  -- Update shares table
  INSERT INTO shares (content_id, viewer_id, referral_link, share_count, points_earned)
  SELECT 
    rl.content_id,
    user_id,
    rl.full_url,
    shares_to_add,
    points_to_add
  FROM referral_links rl
  WHERE rl.viewer_id = user_id
  LIMIT 1
  ON CONFLICT (content_id, viewer_id) 
  DO UPDATE SET 
    share_count = shares.share_count + shares_to_add,
    points_earned = shares.points_earned + points_to_add,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_user_stats TO authenticated;
