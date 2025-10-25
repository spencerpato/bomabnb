-- Create Referral System for BomaBnB
-- Allows middlemen/agents to earn commissions from referred partners

-- Add 'referrer' to app_role enum if not already present
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'app_role' AND e.enumlabel = 'referrer'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'referrer';
  END IF;
END $$;

-- Create referrers table
CREATE TABLE IF NOT EXISTS public.referrers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  business_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status public.partner_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create referrals table (tracks which partners were referred by which referrer)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.referrers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE UNIQUE,
  referred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.referrers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payout_requests table
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.referrers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrers
CREATE POLICY "Referrers are viewable by themselves and admins"
  ON public.referrers FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert referrer applications"
  ON public.referrers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Referrers can update their own data"
  ON public.referrers FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage referrers"
  ON public.referrers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for referrals
CREATE POLICY "Referrers can view their referrals"
  ON public.referrals FOR SELECT
  USING (
    referrer_id IN (SELECT id FROM public.referrers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage referrals"
  ON public.referrals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for commissions
CREATE POLICY "Referrers can view their commissions"
  ON public.commissions FOR SELECT
  USING (
    referrer_id IN (SELECT id FROM public.referrers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can create commissions"
  ON public.commissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage commissions"
  ON public.commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payout_requests
CREATE POLICY "Referrers can view their payout requests"
  ON public.payout_requests FOR SELECT
  USING (
    referrer_id IN (SELECT id FROM public.referrers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Referrers can create payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (
    referrer_id IN (SELECT id FROM public.referrers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage payout requests"
  ON public.payout_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrers_user_id ON public.referrers(user_id);
CREATE INDEX IF NOT EXISTS idx_referrers_referral_code ON public.referrers(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrers_status ON public.referrers(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_partner_id ON public.referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referrer_id ON public.commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_booking_id ON public.commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_referrer_id ON public.payout_requests(referrer_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- Add triggers for updated_at
CREATE TRIGGER update_referrers_updated_at
  BEFORE UPDATE ON public.referrers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referrers WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to automatically create commission when booking is completed
CREATE OR REPLACE FUNCTION public.create_commission_on_booking_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referred_partner_id UUID;
  referrer_record RECORD;
  property_partner_id UUID;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get the partner_id for this property
    SELECT partner_id INTO property_partner_id
    FROM public.properties
    WHERE id = NEW.property_id;
    
    -- Check if this partner was referred
    SELECT r.referrer_id, ref.commission_rate
    INTO referrer_record
    FROM public.referrals r
    JOIN public.referrers ref ON r.referrer_id = ref.id
    WHERE r.partner_id = property_partner_id
    AND r.status = 'active'
    AND ref.status = 'active';
    
    -- If partner was referred, create commission
    IF FOUND THEN
      INSERT INTO public.commissions (
        referrer_id,
        booking_id,
        partner_id,
        property_id,
        booking_amount,
        commission_rate,
        commission_amount,
        status
      ) VALUES (
        referrer_record.referrer_id,
        NEW.id,
        property_partner_id,
        NEW.property_id,
        NEW.total_price,
        referrer_record.commission_rate,
        (NEW.total_price * referrer_record.commission_rate / 100),
        'pending'
      )
      ON CONFLICT (booking_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic commission creation
DROP TRIGGER IF EXISTS create_commission_trigger ON public.bookings;
CREATE TRIGGER create_commission_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_commission_on_booking_complete();

-- Add comments
COMMENT ON TABLE public.referrers IS 'Referrers/agents who can refer partners and earn commissions';
COMMENT ON TABLE public.referrals IS 'Tracks which partners were referred by which referrer';
COMMENT ON TABLE public.commissions IS 'Commission records for completed bookings from referred partners';
COMMENT ON TABLE public.payout_requests IS 'Payout requests from referrers';
