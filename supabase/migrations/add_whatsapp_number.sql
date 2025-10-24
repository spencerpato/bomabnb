-- Add whatsapp_number field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'Separate WhatsApp number (can be different from main phone)';
