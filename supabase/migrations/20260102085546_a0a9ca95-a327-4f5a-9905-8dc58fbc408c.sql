-- Add custom message template column to webhook_settings
ALTER TABLE public.webhook_settings 
ADD COLUMN IF NOT EXISTS custom_message_template TEXT;