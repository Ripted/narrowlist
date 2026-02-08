
-- Drop the old check constraints on webhook_settings
ALTER TABLE webhook_settings DROP CONSTRAINT IF EXISTS webhook_settings_webhook_type_check;
ALTER TABLE webhook_settings DROP CONSTRAINT IF EXISTS webhook_settings_format_style_check;

-- Delete old webhook rows and insert new ones
DELETE FROM webhook_settings;

INSERT INTO webhook_settings (webhook_type, webhook_url, enabled, custom_message_template) VALUES
  ('main_completions', 'https://discord.com/api/webhooks/1454616761637933128/xq4O-w8IV4G1ZHU1-IUTV_G7WVl-z4z6cwaD51OK3dy2ZvcvJt44RmDP1JFvHOBqlsYf', true, '{arrow}**{user}** {action} **#{levelRank} {levelName}** in **{completionTime}**'),
  ('extended_completions', '', false, '{arrow}**{user}** {action} **#{levelRank} {levelName}** in **{completionTime}**'),
  ('extra_completions', '', false, '{arrow}**{user}** {action} **#{levelRank} {levelName}** in **{completionTime}**'),
  ('rank_changes', 'https://discord.com/api/webhooks/1455273514968813818/BaIfmPv3MGM7JihKe4BwrVe_fPvDjydfKAzBPgmMnyXPhB2cBWaP1qGKaBKhcZ-OKG-C', true, '{emoji} **{levelName}** moved from #{oldRank} to #{newRank}');

-- Add UNIQUE constraint on webhook_type
ALTER TABLE webhook_settings ADD CONSTRAINT webhook_settings_type_unique UNIQUE (webhook_type);

-- Recalculate extra level points
UPDATE extended_levels SET points = calculate_extra_points_for_rank(rank_position);
