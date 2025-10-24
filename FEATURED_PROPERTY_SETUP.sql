-- Run this SQL in your Supabase SQL editor to add the featured property system
-- Copy and paste the entire content below into the Supabase SQL editor

-- Add is_featured column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add feature dates to properties table  
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS feature_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS feature_end_date TIMESTAMPTZ;

-- Add property_id column to partner_notifications table
ALTER TABLE partner_notifications 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_feature_dates ON properties(feature_start_date, feature_end_date);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_property_id ON partner_notifications(property_id);

-- Update RLS policies for partner_notifications
DROP POLICY IF EXISTS "Partners can view their own notifications" ON partner_notifications;
CREATE POLICY "Partners can view their own notifications" ON partner_notifications
FOR SELECT USING (
  partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert notifications" ON partner_notifications;
CREATE POLICY "System can insert notifications" ON partner_notifications
FOR INSERT WITH CHECK (true);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('is_featured', 'feature_start_date', 'feature_end_date');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'partner_notifications' 
AND column_name = 'property_id';
