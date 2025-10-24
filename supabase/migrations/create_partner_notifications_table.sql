-- Create partner_notifications table
CREATE TABLE IF NOT EXISTS public.partner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.partner_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can view their own notifications
CREATE POLICY "Partners can view own notifications"
ON public.partner_notifications FOR SELECT
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Policy: Partners can update status of their notifications
CREATE POLICY "Partners can update notification status"
ON public.partner_notifications FOR UPDATE
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can insert notifications
CREATE POLICY "Admins can create partner notifications"
ON public.partner_notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can delete notifications
CREATE POLICY "Admins can delete partner notifications"
ON public.partner_notifications FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Helpful indexes
CREATE INDEX idx_partner_notifications_partner_id ON public.partner_notifications(partner_id);
CREATE INDEX idx_partner_notifications_status ON public.partner_notifications(status);
CREATE INDEX idx_partner_notifications_created_at ON public.partner_notifications(created_at DESC);

COMMENT ON TABLE public.partner_notifications IS 'Notifications shown on partner dashboard and notifications page.';
