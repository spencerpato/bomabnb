-- Run this SQL in your Supabase SQL Editor to create the global_settings table

-- Create global_settings table for platform-wide configuration
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Everyone can read global settings" ON public.global_settings;

-- Policy: Only admins can manage global settings
CREATE POLICY "Admins can manage global settings"
ON public.global_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Everyone can read global settings
CREATE POLICY "Everyone can read global settings"
ON public.global_settings FOR SELECT
USING (true);

-- Insert default contact settings
INSERT INTO public.global_settings (setting_key, setting_value, description) VALUES
('contact_email', 'patomaich611@gmail.com', 'Primary contact email for the platform'),
('contact_phone', '+254 703 998 717', 'Primary contact phone number'),
('whatsapp_number', '+254 703 998 717', 'WhatsApp contact number'),
('business_address', 'Nairobi, Kenya', 'Business physical address'),
('support_email', 'support@bomabnb.com', 'Support email address'),
('privacy_email', 'privacy@bomabnb.com', 'Privacy policy contact email'),
('company_name', 'BomaBnB', 'Company/platform name'),
('website_url', 'https://bomabnb.com', 'Main website URL')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON public.global_settings(setting_key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_global_settings_updated_at ON public.global_settings;

CREATE TRIGGER update_global_settings_updated_at 
    BEFORE UPDATE ON public.global_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.global_settings IS 'Global platform settings including contact information';

-- Verify the table was created and has data
SELECT * FROM public.global_settings ORDER BY setting_key;
