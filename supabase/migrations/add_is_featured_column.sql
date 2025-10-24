-- Add is_featured column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON public.properties(is_featured);

-- Add comment
COMMENT ON COLUMN public.properties.is_featured IS 'Indicates if the property is currently featured on the homepage';

