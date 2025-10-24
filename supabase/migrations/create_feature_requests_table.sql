-- Create feature_requests table
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  duration_days INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  additional_remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can view their own feature requests
CREATE POLICY "Partners can view own feature requests"
ON public.feature_requests FOR SELECT
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Policy: Partners can insert their own feature requests
CREATE POLICY "Partners can create feature requests"
ON public.feature_requests FOR INSERT
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can view all feature requests
CREATE POLICY "Admins can view all feature requests"
ON public.feature_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can update feature requests
CREATE POLICY "Admins can update feature requests"
ON public.feature_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_feature_requests_partner_id ON public.feature_requests(partner_id);
CREATE INDEX idx_feature_requests_property_id ON public.feature_requests(property_id);
CREATE INDEX idx_feature_requests_status ON public.feature_requests(status);

-- Add comment
COMMENT ON TABLE public.feature_requests IS 'Stores partner requests to feature their properties';
