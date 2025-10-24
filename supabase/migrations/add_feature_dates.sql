-- Add feature start and end date columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS feature_start_date TIMESTAMPTZ;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS feature_end_date TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_feature_dates ON public.properties(feature_start_date, feature_end_date);

-- Add comments
COMMENT ON COLUMN public.properties.feature_start_date IS 'Date when the property became featured';
COMMENT ON COLUMN public.properties.feature_end_date IS 'Date when the property feature expires';

