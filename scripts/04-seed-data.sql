-- Insert sample creator profiles (these would be created through the signup process)
-- Note: In production, these would be created via the auth.users table first

-- Sample content (assuming we have creator users)
INSERT INTO content (id, creator_id, title, description, platform, content_url, points_per_share, campaign_duration, status) VALUES
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE user_type = 'creator' LIMIT 1),
    'How to Master Social Media Marketing in 2024',
    'Complete guide to social media marketing strategies that actually work in 2024',
    'youtube',
    'https://youtube.com/watch?v=example1',
    15,
    30,
    'active'
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM profiles WHERE user_type = 'creator' LIMIT 1),
    'Top 10 Content Creation Tips',
    'Essential tips for creating engaging content across all platforms',
    'instagram',
    'https://instagram.com/p/example2',
    10,
    30,
    'active'
  );

-- Sample rewards
INSERT INTO rewards (content_id, type, title, description, shares_required, quantity) VALUES
  (
    (SELECT id FROM content WHERE title = 'How to Master Social Media Marketing in 2024'),
    'physical',
    'iPhone 15 Pro',
    'Latest iPhone 15 Pro - 256GB in Natural Titanium',
    500,
    1
  ),
  (
    (SELECT id FROM content WHERE title = 'How to Master Social Media Marketing in 2024'),
    'digital',
    'Exclusive Marketing Course',
    'Access to my premium marketing course worth $299',
    100,
    50
  ),
  (
    (SELECT id FROM content WHERE title = 'Top 10 Content Creation Tips'),
    'raffle',
    'Monthly Raffle Entry',
    'Entry into monthly prize raffle',
    50,
    NULL
  );
