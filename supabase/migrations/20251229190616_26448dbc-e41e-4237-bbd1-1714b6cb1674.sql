-- Create webhook_settings table for admin webhook customization
CREATE TABLE public.webhook_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type text NOT NULL UNIQUE CHECK (webhook_type IN ('completions', 'admin')),
  webhook_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  include_completions boolean DEFAULT true,
  include_verifications boolean DEFAULT true,
  include_rank_changes boolean DEFAULT true,
  include_future_levels boolean DEFAULT true,
  include_level_additions boolean DEFAULT true,
  include_level_deletions boolean DEFAULT true,
  format_style text DEFAULT 'formal' CHECK (format_style IN ('formal', 'casual', 'minimal')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage webhook settings" 
ON public.webhook_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view webhook settings" 
ON public.webhook_settings 
FOR SELECT 
USING (true);

-- Insert default webhook settings
INSERT INTO public.webhook_settings (webhook_type, webhook_url, enabled)
VALUES 
  ('completions', 'https://discord.com/api/webhooks/1454616761637933128/xq4O-w8IV4G1ZHU1-IUTV_G7WVl-z4z6cwaD51OK3dy2ZvcvJt44RmDP1JFvHOBqlsYf', true),
  ('admin', 'https://discord.com/api/webhooks/1455273514968813818/BaIfmPv3MGM7JihKe4BwrVe_fPvDjydfKAzBPgmMnyXPhB2cBWaP1qGKaBKhcZ-OKG-C', true);

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_settings_updated_at
BEFORE UPDATE ON public.webhook_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();