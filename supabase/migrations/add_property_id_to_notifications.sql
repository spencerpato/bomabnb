-- Add property_id column to partner_notifications table
ALTER TABLE partner_notifications 
ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_partner_notifications_property_id ON partner_notifications(property_id);

-- Update RLS policy to allow partners to see notifications for their properties
DROP POLICY IF EXISTS "Partners can view their own notifications" ON partner_notifications;

CREATE POLICY "Partners can view their own notifications" ON partner_notifications
FOR SELECT USING (
  partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  )
);

-- Update RLS policy for insert (for system notifications)
DROP POLICY IF EXISTS "System can insert notifications" ON partner_notifications;

CREATE POLICY "System can insert notifications" ON partner_notifications
FOR INSERT WITH CHECK (true);
