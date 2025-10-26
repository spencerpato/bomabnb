-- Add contact visibility field to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS show_contacts_publicly BOOLEAN NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.partners.show_contacts_publicly IS 'Controls whether partner contact info is visible on property pages';
