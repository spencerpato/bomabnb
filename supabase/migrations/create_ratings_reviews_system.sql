-- Create ratings and reviews system for BomaBnB

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  device_fingerprint TEXT, -- For preventing duplicate reviews from anonymous users
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partner replies to reviews table
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.property_reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create review reports table (for flagging inappropriate reviews)
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.property_reviews(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create materialized view for property ratings summary (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.property_ratings_summary AS
SELECT 
  property_id,
  COUNT(*) as total_reviews,
  AVG(rating) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
  MAX(created_at) as latest_review_date
FROM public.property_reviews
WHERE is_approved = true
GROUP BY property_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_ratings_summary_property_id 
ON public.property_ratings_summary(property_id);

-- Enable RLS
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_reviews
CREATE POLICY "Approved reviews are viewable by everyone"
ON public.property_reviews FOR SELECT
USING (is_approved = true OR auth.uid() IN (
  SELECT user_id FROM public.partners 
  WHERE id IN (SELECT partner_id FROM public.properties WHERE id = property_id)
) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert reviews"
ON public.property_reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own reviews"
ON public.property_reviews FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
ON public.property_reviews FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for review_replies
CREATE POLICY "Review replies are viewable by everyone"
ON public.review_replies FOR SELECT
USING (true);

CREATE POLICY "Partners can reply to reviews on their properties"
ON public.review_replies FOR INSERT
WITH CHECK (
  partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  AND review_id IN (
    SELECT pr.id FROM public.property_reviews pr
    JOIN public.properties p ON pr.property_id = p.id
    WHERE p.partner_id = partner_id
  )
);

CREATE POLICY "Partners can update their own replies"
ON public.review_replies FOR UPDATE
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can delete their own replies"
ON public.review_replies FOR DELETE
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- RLS Policies for review_reports
CREATE POLICY "Admins can view all reports"
ON public.review_reports FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create reports"
ON public.review_reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update reports"
ON public.review_reports FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_reviews_property_id ON public.property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_user_id ON public.property_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_created_at ON public.property_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_reviews_rating ON public.property_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_property_reviews_approved ON public.property_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_partner_id ON public.review_replies(partner_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);

-- Create function to refresh ratings summary
CREATE OR REPLACE FUNCTION public.refresh_property_ratings_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.property_ratings_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when reviews change
DROP TRIGGER IF EXISTS refresh_ratings_summary ON public.property_reviews;
CREATE TRIGGER refresh_ratings_summary
AFTER INSERT OR UPDATE OR DELETE ON public.property_reviews
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_property_ratings_summary();

-- Add updated_at triggers
CREATE TRIGGER update_property_reviews_updated_at
BEFORE UPDATE ON public.property_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_replies_updated_at
BEFORE UPDATE ON public.review_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.property_reviews IS 'User reviews and ratings for properties';
COMMENT ON TABLE public.review_replies IS 'Partner responses to property reviews';
COMMENT ON TABLE public.review_reports IS 'User reports of inappropriate reviews';
COMMENT ON MATERIALIZED VIEW public.property_ratings_summary IS 'Cached summary of property ratings for performance';
